// Hardcoded Google YouTube Data API v3 Key
const API_KEY = 'AIzaSyDt5164sPyXzmqFqKcr-7bOxcVzail4o_s';

// URL Extractor covering standard, shared, short and mobile links
function extractYouTubeId(url) {
    url = url.trim(); 
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
}

// Converts ISO 8601 string (e.g. PT4M13S) into standard readable time (e.g. 4:13)
function parseDuration(apiDuration) {
    if (apiDuration === "P0D") return "LIVE";
    
    const matches = apiDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return "--:--";

    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    const seconds = parseInt(matches[3]) || 0;

    let result = "";
    if (hours > 0) {
        result += hours + ":" + (minutes < 10 ? "0" : "");
    }
    result += minutes + ":";
    result += (seconds < 10 ? "0" : "") + seconds;

    return result;
}

async function addVideo() {
    const urlInput = document.getElementById('urlInput');
    const videoId = extractYouTubeId(urlInput.value);

    if (!videoId) {
        alert("Invalid YouTube Link. Please try again.");
        return;
    }

    try {
        // Fetch specific video data directly via API using Snippet and ContentDetails
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${API_KEY}`);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            alert("Video not found. It might be private or deleted.");
            return;
        }

        // Gather real values from API Payload
        const videoData = data.items[0];
        const realTitle = videoData.snippet.title;
        const channelName = videoData.snippet.channelTitle;
        const rawDuration = videoData.contentDetails.duration;
        
        // Process duration format & grab thumbnail URL
        const displayDuration = parseDuration(rawDuration);
        const thumbnailUrl = videoData.snippet.thumbnails.medium.url;

        // Build Sidebar Card DOM Element
        const queueList = document.getElementById('queueList');
        const card = document.createElement('div');
        card.className = 'video-card';
        
        // Setup interaction trigger to load into the iframe player on the right
        card.onclick = function() { 
            loadActiveVideo(videoId); 
        };

        // Inject real variables dynamically
        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${thumbnailUrl}" alt="Thumbnail">
                <div class="duration-badge">${displayDuration}</div>
            </div>
            <div class="video-info">
                <h4 title="${realTitle}">${realTitle}</h4>
                <div class="channel-name">${channelName}</div>
            </div>
        `;

        queueList.appendChild(card);
        urlInput.value = ''; // Clear input layout environment

    } catch (error) {
        console.error("API Error: ", error);
        alert("Something went wrong fetching data from YouTube.");
    }
}

// Embed logic launching player into browser right side window frame
function loadActiveVideo(id) {
    const playerContainer = document.getElementById('playerContainer');
    playerContainer.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
}