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

const SEPARATOR_Y = 600;

// === SMEAGOL KEY TRIGGERS ===
// If any of the strings in each array are typed, spawn corresponding message.
const SMEAGOL_TRIGGERS = [
    { triggers: ["smeagol"], message: "Don't know who that is..." },
    { triggers: ["deagol"], message: "..." },
    { triggers: ["gollum"], message: "How do you get a Pikachu on a bus?" },
    { triggers: ["you poke him on", "you pokemon", "you poke em on", "you poke im on"], message: "What's the square root of 144?" },
    { triggers: ["twelve"], message: "When was Bubsy 3D released?" },
    { triggers: ["November 25 1996", "11-25-1996", "11/25/1996", "November 25, 1996"], message: "What is the average rainfall of the Amazon Basin?" },
    { triggers: ["6 feet", "10 feet", "1.8 meters", "3 meters", "ten feet", "six feet"], message: "Where am I?" },
    { triggers: ["deschutes"], message: "Now, if you all would kindly look under your chairs…" },
];

// store typed characters here
let smeagolBuffer = "";

// === EXECUTION ===
function initDeschutesGifs() {
    const container = document.getElementById("deschutes-section");
    if (!container) {
        console.error("No element with id 'deschutes-section' found.");
        return;
    }

    container.style.position = "relative";
    const containerHeight = container.offsetHeight;
    const containerWidth = container.offsetWidth;

    // Random animal gifs
    for (let i = 0; i < NUM_RANDOM_GIFS; i++) {
        const [gifName, scale] = RANDOM_GIF_DATA[Math.floor(Math.random() * RANDOM_GIF_DATA.length)];
        const gif = document.createElement("img");
        gif.src = DESCHUTES_ROOT_PATH + gifName;
        Object.assign(gif.style, {
            position: "absolute",
            transform: `scale(${scale})`,
            top: `${getRandom(0, SEPARATOR_Y)}px`,
            left: `${getRandom(0, containerWidth - 100)}px`,
            pointerEvents: "none",
        });
        container.appendChild(gif);
    }

    // Spinny fish
    for (let i = 0; i < NUM_SPINNY_FISH; i++) {
        const fish = document.createElement("img");
        fish.src = DESCHUTES_ROOT_PATH + SPINNY_FISH_NAME;
        Object.assign(fish.style, {
            position: "absolute",
            transform: `scale(${SPINNY_FISH_SCALE})`,
            top: `${getRandom(SEPARATOR_Y, containerHeight - 50)}px`,
            left: `${getRandom(0, containerWidth - 100)}px`,
            pointerEvents: "none",
        });
        container.appendChild(fish);
    }

    // === SMEAGOL SECTION ===
    const smeagolWrapper = document.createElement("div");
    Object.assign(smeagolWrapper.style, {
        position: "absolute",
        left: "40px",
        top: `${SEPARATOR_Y + 50}px`,
        textAlign: "center",
        pointerEvents: "none",
        zIndex: "10",
    });

    const smeagolText = document.createElement("div");
    smeagolText.textContent = "most fish I've caught:";
    smeagolText.className = "smeagol-rainbow-text";
    smeagolText.style.fontSize = "33px";

    const smeagolImg = document.createElement("img");
    smeagolImg.src = DESCHUTES_ROOT_PATH + "smeagol.png";
    Object.assign(smeagolImg.style, {
        width: "220px",
        display: "block",
        margin: "0 auto",
    });

    smeagolWrapper.appendChild(smeagolText);
    smeagolWrapper.appendChild(smeagolImg);
    container.appendChild(smeagolWrapper);

    // Attach keyboard handler for Smeagol triggers
    document.addEventListener("keydown", (e) => {
        let char = "";

        if (e.key.length === 1) {
            // single characters (letters, numbers, punctuation, space included)
            char = e.key.toLowerCase();
        } else if (e.key === " " || e.code === "Space") {
            char = " ";
            e.preventDefault(); // stop page scroll globally
        }

        if (char) {
            smeagolBuffer += char;
            // keep buffer from growing too big
            if (smeagolBuffer.length > 80) {
                smeagolBuffer = smeagolBuffer.slice(-80);
            }

            // check triggers (case insensitive, spaces allowed)
            for (const entry of SMEAGOL_TRIGGERS) {
                for (const trig of entry.triggers) {
                    if (smeagolBuffer.endsWith(trig.toLowerCase())) {
                        spawnFloatingText(smeagolWrapper, entry.message);
                        // optional: clear buffer to avoid spam
                        // smeagolBuffer = "";
                        return;
                    }
                }
            }
        }
    });


}

function spawnFloatingText(smeagolWrapper, message) {
    const textEl = document.createElement("div");
    textEl.textContent = message;
    Object.assign(textEl.style, {
        position: "absolute",
        left: "50%",
        bottom: "53%", // just above Smeagol
        transform: "translateX(-50%)",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "20px",
        fontWeight: "bold",
        color: "#ffffff",
        opacity: "1",
        pointerEvents: "none",
        transition: "transform 3.4s linear, opacity 2.4s linear",
    });

    smeagolWrapper.appendChild(textEl);

    // force reflow so transition applies
    void textEl.offsetWidth;

    // animate upward + fade
    // Move horizontally to center (-50%), and vertically up by 100px
    textEl.style.transform = "translate(-50%, -40px)";
    textEl.style.opacity = "0";

    // remove after animation
    setTimeout(() => textEl.remove(), 3000);
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.addEventListener("DOMContentLoaded", initDeschutesGifs);
