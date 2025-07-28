// Theater Section Module
const TheaterSection = {
    THEATER_SCRIPT_PATH: "../assets/theater/scripts/",
    textFiles: [
        "charlie-brown.txt",
        "earnest.txt",
        "elf.txt",
        "arsenic.txt"
    ],

    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.loadMarqueeTexts();
        });
    },

    loadMarqueeTexts() {
        const marqueeTracks = document.querySelectorAll(".marquee-track");
        
        marqueeTracks.forEach((track, index) => {
            const file = this.THEATER_SCRIPT_PATH + this.textFiles[index];
            const duration = Math.floor(Math.random() * 4000 + 2000); // 20s to 50s
            
            fetch(file)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to load ${file}`);
                    return response.text();
                })
                .then(text => {
                    const clean = text.replace(/\s+/g, ' ').trim();
                    track.textContent = clean;
                    track.style.animationDuration = `${duration}s`;
                })
                .catch(err => {
                    console.error(err);
                    track.textContent = `[Error loading ${file}]`;
                });
        });
    }
};

// Initialize Theater section
TheaterSection.init();
