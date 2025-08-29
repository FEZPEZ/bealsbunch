// Pixar Cars Section Module
const PixarCarsSection = {
    NUM_CARS_IMAGES: 16,
    IMAGE_PATH: "./assets/pixar-cars/",
    gifIndices: new Set([3, 5, 11, 16]),

    clickCountImage12: 0, // track clicks

    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.addHeader();
            this.populateImageGrid();
        });
    },

    addHeader() {
        const container = document.getElementById("pixar-cars");
        if (!container) return;

        const header = document.createElement("h1");
        header.textContent = "my christmas list";

        // obnoxious GeoCities car-themed CSS
        Object.assign(header.style, {
            fontFamily: "'Comic Sans MS', cursive, sans-serif",
            fontSize: "48px",
            color: "yellow",
            textShadow: "2px 2px 0 red, 4px 4px 0 blue",
            background: "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #0000ff, #ff00ff)",
            padding: "20px",
            border: "8px ridge lime",
            textAlign: "center",
            animation: "blink 1.1s step-start infinite",
        });

        // Add a simple blink animation
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            @keyframes blink {
                50% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(styleSheet);

        container.prepend(header);
    },

    populateImageGrid() {
        const container = document.getElementById("pixar-cars");
        if (!container) return;

        for (let i = 1; i <= this.NUM_CARS_IMAGES; i++) {
            const ext = this.gifIndices.has(i) ? "gif" : "png";
            const img = document.createElement("img");
            img.src = `${this.IMAGE_PATH}image${i}.${ext}`;
            img.alt = `Car ${i}`;
            img.classList.add("collage-image");

            // If it's image12.png, attach click tracking
            if (i === 12 && ext === "png") {
                img.addEventListener("click", () => {
                    this.clickCountImage12++;
                    if (this.clickCountImage12 === 95) {
                        this.addImage17(container);
                    }
                });
            }

            container.appendChild(img);
        }
    },

    addImage17(container) {
        const img = document.createElement("img");
        img.src = `${this.IMAGE_PATH}image17.png`;
        img.alt = "Car 17";
        img.classList.add("collage-image");
        container.appendChild(img);
    }
};

// Initialize Pixar Cars section
PixarCarsSection.init();
