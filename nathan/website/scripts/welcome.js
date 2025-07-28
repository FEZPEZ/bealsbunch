// Welcome Section Module
const WelcomeSection = {
    init() {
        document.addEventListener('sectionsLoaded', () => {
            this.setupLinks();
        });
    },

    setupLinks() {
        // Add any specific functionality for welcome section links
        const links = document.querySelectorAll('#welcome-section a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // Placeholder for link functionality
                console.log('Welcome link clicked:', e.target.href);
                // You can add proper routing here
            });
        });
    }
};

// Initialize Welcome section
WelcomeSection.init();
