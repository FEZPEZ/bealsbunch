// Space Section Module
const SpaceSection = {
    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.setupSection();
        });
    },

    setupSection() {
        // Placeholder for Space section functionality
        const wrapper = document.querySelector('.space-wrapper');
        if (wrapper) {
            // Add any Space-specific functionality here
            console.log('Space section initialized');
        }
    }
};

// Initialize Space section
SpaceSection.init();
