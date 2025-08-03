/**
 * Section Loader Module
 * Dynamically loads HTML sections into the main page
 */

const SectionLoader = {
    sections: [
        { id: 'pixar-cars-section', file: 'sections/pixar-cars.html' },
        { id: 'windows-xp-section', file: 'sections/windows-xp.html' },
        { id: 'theater-section', file: 'sections/theater.html' },
        { id: 'welcome-section', file: 'sections/welcome.html' },
        { id: 'nintendo-section', file: 'sections/nintendo.html' },
        { id: 'plant-tags-section', file: 'sections/plant-tags.html' },
        { id: 'movie-section', file: 'sections/movie.html' },
        { id: 'metroid-section', file: 'sections/metroid.html' },
        { id: 'smash-roster', file: 'sections/smash-roster.html' },
        { id: 'space-section', file: 'sections/space.html' }
    ],

    async loadSection(sectionConfig) {
        try {
            const response = await fetch(sectionConfig.file);
            if (!response.ok) {
                throw new Error(`Failed to load ${sectionConfig.file}`);
            }
            const html = await response.text();
            const container = document.getElementById(sectionConfig.id);
            if (container) {
                container.innerHTML = html;
            }
        } catch (error) {
            console.error(`Error loading section ${sectionConfig.id}:`, error);
        }
    },

    async loadAllSections() {
        const loadPromises = this.sections.map(section => this.loadSection(section));
        await Promise.all(loadPromises);
        
        // Trigger custom event when all sections are loaded
        document.dispatchEvent(new CustomEvent('sectionsLoaded'));
    },

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadAllSections();
        });
    }
};

// Initialize the section loader
SectionLoader.init();
