let player;
let currentVideoId = null;
let playlist = JSON.parse(localStorage.getItem("qq_playlist") || "[]");

const input = document.getElementById("videoInput");
const playlistEl = document.getElementById("playlist");
const removeCurrent = document.getElementById("removeCurrent");
const playerWrapper = document.getElementById("player-wrapper");

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
  });
  renderPlaylist();
}

function savePlaylist() {
  localStorage.setItem("qq_playlist", JSON.stringify(playlist));
}

function extractVideoId(url) {
  const regex =
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/))([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function fetchVideoTitle(id) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    );
    const data = await res.json();
    return data.title;
  } catch {
    return `Video ${id}`;
  }
}

/* ---------- PLAYLIST ---------- */
function renderPlaylist() {
  playlistEl.innerHTML = "";
  playlist.forEach((video, index) => {
    const li = document.createElement("li");
    li.className = "playlist-item";
    li.innerHTML = `
      <img class="thumbnail" src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="">
      <div class="controls">
        <button onclick="moveUp(${index})">▲</button>
        <button onclick="moveDown(${index})">▼</button>
        <button onclick="deleteVideo(${index})">🗑️</button>
      </div>
      <div class="title">${video.title}</div>
    `;
    li.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      playVideo(video.id);
    });
    playlistEl.appendChild(li);
  });
  savePlaylist();
}

/* ---------- REORDER ---------- */
function moveUp(index) {
  if (index === 0) return;
  [playlist[index - 1], playlist[index]] = [playlist[index], playlist[index - 1]];
  renderPlaylist();
}

function moveDown(index) {
  if (index >= playlist.length - 1) return;
  [playlist[index + 1], playlist[index]] = [playlist[index], playlist[index + 1]];
  renderPlaylist();
}

/* ---------- DELETE VIDEO ---------- */
function deleteVideo(index) {
  const wasPlaying = playlist[index].id === currentVideoId;
  playlist.splice(index, 1);
  if (wasPlaying) clearPlayer();
  renderPlaylist();
}

/* ---------- PLAYER ---------- */
function playVideo(id) {
  currentVideoId = id;
  playerWrapper.classList.remove("hidden");
  player.loadVideoById(id);
  removeCurrent.classList.remove("hidden");
}

function clearPlayer() {
  if (player) {
    try {
      player.stopVideo();
      player.loadVideoById(""); // clear iframe content completely
    } catch (err) {
      console.warn("Clear player failed:", err);
    }
  }
  currentVideoId = null;
  playerWrapper.classList.add("hidden");
  removeCurrent.classList.add("hidden");
}

removeCurrent.addEventListener("click", clearPlayer);

/* ---------- ADDING VIDEOS ---------- */
input.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    const url = e.target.value.trim();
    const id = extractVideoId(url);
    if (!id) {
      alert("Please paste a valid YouTube URL");
      return;
    }
    const title = await fetchVideoTitle(id);
    playlist.push({ id, title });
    renderPlaylist();
    e.target.value = "";
  }
});

/* ---------- INIT ---------- */
renderPlaylist();