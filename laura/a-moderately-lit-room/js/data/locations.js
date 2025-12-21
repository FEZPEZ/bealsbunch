// js/data/locations.js
const LOCATIONS = {
    kitchen: {
        id: 'kitchen',
        name: 'The Kitchen',
        primaryResource: 'paper',
        primaryAmount: 5,
        primaryCooldown: 10,
        secondaryResources: [
            { name: 'crumpets', min: 1, max: 4, chance: 1.0 },
            { name: 'mysteryLumps', min: 1, max: 2, chance: 0.2 }
        ]
    }
};