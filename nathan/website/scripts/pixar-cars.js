// Pixar Cars Section Module
const PixarCarsSection = {
    NUM_CARS_IMAGES: 16,
    IMAGE_PATH: "../assets/pixar-cars/",
    
    // Explicitly list which images are GIFs
    gifIndices: new Set([3, 5, 11, 16]), // update based on your actual GIFs
    
    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.populateImageGrid();
        });
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
            container.appendChild(img);
        }
    }
};

// Initialize Pixar Cars section
PixarCarsSection.init();
