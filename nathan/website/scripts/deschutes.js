// === CONFIGURATION ===
const DESCHUTES_ROOT_PATH = "./assets/deschutes/";

const RANDOM_GIF_DATA = [
    ["bear.gif", 0.3],
    ["bird-1.gif", 0.5],
    ["bird-3.gif", 0.7],
    ["birds-1.gif", 0.9],
    ["birds-2.gif", 0.9]
];

const NUM_RANDOM_GIFS = 15;
const NUM_SPINNY_FISH = 25;

const SPINNY_FISH_NAME = "spinny-fish.gif";
const SPINNY_FISH_SCALE = 0.5;

// Horizontal line (in px from top of container) that separates animal gifs (top) and spinny fish (bottom)
const SEPARATOR_Y = 600;

// === EXECUTION ===
function initDeschutesGifs() {
    const container = document.getElementById("deschutes-section");
    if (!container) {
        console.error("No element with id 'deschutes-section' found.");
        return;
    }

    // Ensure container is relatively positioned
    container.style.position = "relative";

    const containerRect = container.getBoundingClientRect();
    const containerHeight = container.offsetHeight;
    const containerWidth = container.offsetWidth;

    // Random animal gifs in the upper zone
    for (let i = 0; i < NUM_RANDOM_GIFS; i++) {
        const [gifName, scale] = RANDOM_GIF_DATA[Math.floor(Math.random() * RANDOM_GIF_DATA.length)];
        const gif = document.createElement("img");
        gif.src = DESCHUTES_ROOT_PATH + gifName;
        gif.style.position = "absolute";
        gif.style.transform = `scale(${scale})`;
        gif.style.top = `${getRandom(0, SEPARATOR_Y)}px`;
        gif.style.left = `${getRandom(0, containerWidth - 100)}px`; // assume 100px buffer
        gif.style.pointerEvents = "none";
        container.appendChild(gif);
    }

    // Random spinny fish gifs in the lower zone
    for (let i = 0; i < NUM_SPINNY_FISH; i++) {
        const fish = document.createElement("img");
        fish.src = DESCHUTES_ROOT_PATH + SPINNY_FISH_NAME;
        fish.style.position = "absolute";
        fish.style.transform = `scale(${SPINNY_FISH_SCALE})`;
        fish.style.top = `${getRandom(SEPARATOR_Y, containerHeight - 50)}px`; // 50px buffer
        fish.style.left = `${getRandom(0, containerWidth - 100)}px`;
        fish.style.pointerEvents = "none";
        container.appendChild(fish);
    }



    // === SMEAGOL SECTION ===
    const smeagolWrapper = document.createElement("div");
    smeagolWrapper.style.position = "absolute";
    smeagolWrapper.style.left = "40px";
    smeagolWrapper.style.top = `${SEPARATOR_Y + 50}px`; // place near the top of spinny-fish zone
    smeagolWrapper.style.textAlign = "center";
    smeagolWrapper.style.pointerEvents = "none";
    smeagolWrapper.style.zIndex = "10"; // ensure it's on top

    const smeagolText = document.createElement("div");
    smeagolText.textContent = "most fish I've caught:";
    smeagolText.className = "smeagol-rainbow-text";
    smeagolText.style.fontSize = "33px";

    const smeagolImg = document.createElement("img");
    smeagolImg.src = DESCHUTES_ROOT_PATH + "smeagol.png";
    smeagolImg.style.width = "220px";
    smeagolImg.style.display = "block";
    smeagolImg.style.margin = "0 auto";

    smeagolWrapper.appendChild(smeagolText);
    smeagolWrapper.appendChild(smeagolImg);
    container.appendChild(smeagolWrapper);

}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.addEventListener("DOMContentLoaded", initDeschutesGifs);
