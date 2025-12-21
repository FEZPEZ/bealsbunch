// js/data/enemies.js
const ENEMIES = {
    // Ring 1-3 enemies (3-10 health)
    bigSpooky: {
        id: 'bigSpooky',
        name: 'big spooky',
        health: 10,
        travelTime: 15000,
        intro: "You've been spooked by a big spooky!"
    },
    notNiceRat: {
        id: 'notNiceRat',
        name: 'not nice rat',
        health: 5,
        travelTime: 12000,
        intro: "a not nice rat runs up and down the ceiling"
    },
    leakyPipe: {
        id: 'leakyPipe',
        name: 'leaky pipe',
        health: 3,
        travelTime: 20000,
        intro: "a sudden pipe starts dripping on you"
    },

    // Ring 4-7 enemies (15-25 health)
    goblin: {
        id: 'goblin',
        name: 'goblin??',
        health: 25,
        travelTime: 12000,
        intro: "it seems a goblin is throwing pencils at you, but it's hard to see"
    },
    christmasDecorations: {
        id: 'christmasDecorations',
        name: 'christmas decorations',
        health: 15,
        travelTime: 18000,
        intro: "you stubbed your toe on a box"
    },
    spider: {
        id: 'spider',
        name: 'spider',
        health: 20,
        travelTime: 10000,
        intro: "a funny spider does a funny dance"
    },

    // Rest of map enemies (50-200 health)
    bigBug: {
        id: 'bigBug',
        name: 'a big bug',
        health: 100,
        travelTime: 12000,
        intro: "a big bug appears"
    },

    // Special enemies
    marshmallow: {
        id: 'marshmallow',
        name: 'giant marshmallow',
        health: 500,
        travelTime: 10000,
        intro: "A big giant gigantic marshmallow sits in the corner. Poke it with a stick?",
        optional: true
    },
    tubeDude: {
        id: 'tubeDude',
        name: 'tube dude',
        health: 30000,
        travelTime: 999999, // Doesn't move
        intro: "It's a tube dude! And he's not budging!",
        optional: true
    }
};