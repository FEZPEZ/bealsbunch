// js/data/events.js
const VAULT_PASSWORDS = ['numnum'];

const VAULT_DIAL_OPTIONS = [
    ['s', 'j', 'b', 'k', 'n'],
    ['n', 'o', 'a', 'i', 'u', 'y', 'w'],
    ['e', 'u', 'n', 'm', 'b'],
    ['e', 'n', 'a', 'k', 'b', 'd'],
    ['r', 'c', 'n', 'a', 'u', 'l', 'e', 'g'],
    ['y', 'e', 'a', 'm']
];

const RESULT_TIMEOUT = 500;

const EVENT_TEMPLATES = {
    bananaMan: {
        id: 'bananaMan',
        title: 'A Peculiar Visitor',
        message: 'A man in a banana suit appears at your door. "I hear you\'ve got paper," he says. "Mind if I come in and build stuff?."',
        triggerTime: 40,
        unlocks: ['craftsman'],
        type: 'story'
    },
    junkDrawerUnlock: {
        id: 'junkDrawerUnlock',
        title: 'The Banana Man Speaks',
        message: '"I can make cabinets now," he says, rubbing his hands together. "You should buy some. There\'s a rat in it who sells stuff."',
        type: 'story'
    },
    cellarUnlock: {
        id: 'cellarUnlock',
        title: 'A Hidden Passage',
        message: 'Now you can get into the cellar...is the fridge in there?',
        type: 'story'
    },
    allRatsFound: {
        id: 'allRatsFound',
        title: 'The Rats Speak',
        message: 'The rats have something to tell you! Return to the kitchen.',
        type: 'story'
    },
    ratsGrantPower: {
        id: 'ratsGrantPower',
        title: 'Rat Secrets',
        message: '',
        type: 'story'
    },
    marshmallowDefeated: {
        id: 'marshmallowDefeated',
        title: 'The Marshmallow Secret',
        message: '',
        type: 'story'
    }
};

const RANDOM_EVENTS = {
    sneakySnorfley: {
        id: 'sneakySnorfley',
        title: 'Sneaky Snorfley',
        message: 'A couple of shifty eyes appear across the counter. "Psst... I know the secret password. It\'ll cost ya 1000 crumpets."',
        priority: true,
        condition: () => !GameState.knowsVaultPassword && GameState.hasCellarKey && !GameState.vaultUnlocked && !GameState.hasSeenSnorfley,
        options: [
            {
                text: 'pay 1000 crumpets',
                handler: () => {
                    let resultMessage;
                    if (GameState.resources.crumpets >= 1000) {
                        GameState.removeResource('crumpets', 1000);
                        GameState.knowsVaultPassword = true;
                        GameState.hasSeenSnorfley = true;
                        resultMessage = `"The password is: ${GameState.vaultPassword}" whispers Snorfley before vanishing.`;
                    } else {
                        resultMessage = '"You don\'t have enough crumpets!" Snorfley scurries away.';
                    }

                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'Sneaky Snorfley',
                            message: resultMessage,
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);

                    return resultMessage;
                }
            },
            {
                text: 'decline',
                handler: () => {
                    GameState.hasSeenSnorfley = true;
                    const resultMessage = 'Snorfley shrugs and vanishes into the shadows.';

                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'Sneaky Snorfley',
                            message: resultMessage,
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);

                    return resultMessage;
                }
            }
        ]
    },

    shrimpSale: {
        id: 'shrimpSale',
        title: 'Shrimps',
        message: 'There\'s shrimps on sale in the next exit',
        priority: true,
        condition: () => false, // manually triggered
        options: [
            {
                text: 'yes',
                handler: () => {
                    const amount = Math.floor(Math.random() * 46) + 5;
                    GameState.addResource('shrimps', amount);

                    // Show result in a new popup
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'Purchase Complete',
                            message: `You got ${amount} shrimps!`,
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);

                    return `got ${amount} shrimps`;
                }
            },
            {
                text: 'no',
                handler: () => {
                    // Show result in a new popup
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'Skipped',
                            message: 'You pass by the shrimps.',
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);

                    return 'you pass by the shrimps';
                }
            }
        ]
    },
    shrimps: {
        id: 'shrimpSale',
        title: 'Shrimps',
        message: 'There\'s shrimps on sale in the next exit',
        priority: true,
        condition: () => false, // manually triggered
        options: [
            {
                text: 'yes',
                handler: () => {
                    const amount = Math.floor(Math.random() * 46) + 5;
                    GameState.addResource('shrimps', amount);

                    // Show result in a new popup
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'Purchase Complete',
                            message: `You got ${amount} shrimps!`,
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);

                    return `got ${amount} shrimps`;
                }
            },
            {
                text: 'no',
                handler: () => {
                    // Show result in a new popup
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'Skipped',
                            message: 'You pass by the shrimps.',
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);

                    return 'you pass by the shrimps';
                }
            }
        ]
    },
    dragon: {
        id: 'dragon',
        title: 'How much train and dragon is in how to train your dragon dragon',
        message: 'HOW MUCH HOW TO TRAIN YOUR DRAGON IS IN HOW TO TRAIN YOUR DRAGON?',
        options: [
            {
                text: '5% of the film',
                handler: () => {
                    GameState.addResource('dragonDragon', 1);
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'no',
                            message: 'You got 1 dragon dragon.',
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);
                    return 'you got 1 dragon dragon';
                }
            },
            {
                text: '46 seconds',
                handler: () => {
                    GameState.addResource('dragonDragon', 30);
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'You bet you',
                            message: 'You got 30 dragon dragons!',
                            options: [{ text: 'dragon s', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);
                    return 'you got 30 dragon dragons';
                }
            },
            {
                text: '22 times',
                handler: () => {
                    GameState.addResource('dragonDragon', 1);
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'no',
                            message: 'You got 1 dragon dragon.',
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);
                    return 'you got 1 dragon dragon';
                }
            },
            {
                text: '61.35 mins',
                handler: () => {
                    GameState.addResource('dragonDragon', 1);
                    setTimeout(() => {
                        EventSystem.showEventPopup({
                            title: 'no',
                            message: 'You got 1 dragon dragon.',
                            options: [{ text: 'ok', handler: () => {} }]
                        });
                    }, RESULT_TIMEOUT);
                    return 'you got 1 dragon dragon';
                }
            }
        ]
    }
};

const MAP_EVENTS = {
    R: {
        type: 'R',
        title: 'A Rat Appears!',
        getMessage: () => {
            const a = Math.floor(Math.random() * 20) + 1;
            const b = Math.floor(Math.random() * 20) + 1;
            const op = '+';
            const answer = op === '+' ? a + b : a * b;
            MapSystem.currentMathAnswer = answer;
            return `A rat appears! Solve this to recruit it:<br> ${a} ${op} ${b} = ?`;
        },
        getOptions: () => {
            const correct = MapSystem.currentMathAnswer;
            const options = [correct];
            while (options.length < 4) {
                const wrong = correct + Math.floor(Math.random() * 21) - 10;
                if (wrong !== correct && wrong > 0 && !options.includes(wrong)) {
                    options.push(wrong);
                }
            }
            options.sort(() => Math.random() - 0.5);
            return options.map(opt => ({
                text: String(opt),
                handler: () => {
                    if (opt === correct) {
                        GameState.rats.total++;
                        GameState.rats.paper++;
                        MapSystem.completeCurrentEvent();
                        return 'you recruited the rat!';
                    } else {
                        GameState.map.sanity = Math.max(0, GameState.map.sanity - 3);
                        return 'wrong! the rat bites you. (-3 sanity)';
                    }
                }
            }));
        }
    },
    D: {
        type: 'D',
        title: 'Shrimp Vending Machine',
        getMessage: () => {
            const lumps = GameState.resources.mysteryLumps || 0;
            return `A vending machine. Put in 3 mystery lumps to get some shrimp? You have ${lumps} lumps.`;
        },
        getOptions: () => [{
            text: 'yes',
            handler: () => {
                if (GameState.hasResource('mysteryLumps', 3)) {
                    GameState.removeResource('mysteryLumps', 3);
                    GameState.addResource('shrimps', 3);
                    MapSystem.completeCurrentEvent();
                    return 'you got 3 shrimps!';
                } else {
                    return 'not enough mystery lumps!';
                }
            }
        }, {
            text: 'no',
            handler: () => {
                return 'you walk away from the machine';
            }
        }]
    },
    M: {
        type: 'M',
        title: 'A Craigslist Post',
        getMessage: () => {
            const has = GameState.resources.dragonDragon || 0;
            return `"I want 500 dragon dragon, I'll give you a lot of shrimp". You have ${has} dragon dragon.`;
        },
        getOptions: () => {
            const has = GameState.resources.dragonDragon || 0;
            const options = [];

            if (has >= 500) {
                options.push({
                    text: 'make the trade',
                    handler: () => {
                        GameState.removeResource('dragonDragon', 500);
                        GameState.addResource('shrimps', 100000);
                        MapSystem.completeCurrentEvent();

                        EventSystem.showEventPopup({
                            title: 'Huge Haul',
                            message: 'You traded 500 dragon dragons and received 100,000 shrimps.',
                            options: [{ text: 'ok', handler: () => {} }]
                        });

                        return 'you traded 500 dragon dragons for 100,000 shrimps!';
                    }
                });
            }

            options.push({
                text: 'decline',
                handler: () => {
                    return 'you close the tab';
                }
            });

            return options;
        }
    },

    X: {
        type: 'X',
        title: 'Something Squishy',
        getMessage: () => ENEMIES.marshmallow.intro,
        isBattle: true,
        getOptions: () => [{
            text: 'fight',
            handler: () => {
                if (!GameState.marshmallowDefeated) {
                    BattleSystem.startBattle(ENEMIES.marshmallow);
                } else {
                    MapSystem.renderMap();
                    MapSystem.renderSanity();
                }
                return '';
            }
        }, {
            text: 'leave',
            handler: () => {
                return 'you quietly back away...';
            }
        }]
    },
    H: {
        type: 'H',
        title: 'The Shrimp Shack',
        getMessage: () => 'Looks like there\'s shrimp in here. Might be expired, but, you know, it\'s shrimp.',
        getOptions: () => [{
            text: 'take shrimp',
            handler: () => {
                const amount = Math.floor(Math.random() * 51) + 50;
                GameState.addResource('shrimps', amount);
                MapSystem.useShrimpShack();
                MapSystem.renderMap();
                MapSystem.renderSanity();

                // Show follow-up message
                setTimeout(() => {
                    EventSystem.showEventPopup({
                        title: 'Shrimp!',
                        message: `you grabbed ${amount} shrimps!`,
                        options: [{ text: 'nice', handler: () => {} }]
                    });
                }, 100);

                return '';
            }
        }, {
            text: 'leave',
            handler: () => {
                return 'you leave the shack';
            }
        }]
    },
    Z: {
        type: 'Z',
        title: 'The Secret Vault',
        getMessage: () => 'An iron box with a rusty combination dial. Hasn\'t been used in ages.',
        isVault: true,
        getOptions: () => [{
            text: 'leave',
            handler: () => {
                return 'you walk away from the vault';
            }
        }]
    },
    F: {
        type: 'F',
        title: 'The Refrigerator',
        getMessage: () => 'you found the fridge! But there\'s something on top...',
        getOptions: () => [{
            text: 'next',
            handler: () => {
                EventSystem.showEventPopup({
                    title: 'Tube Dude!',
                    message: "It's the tube dude! And he's not budging!",
                    options: [{
                        text: 'make him budge',
                        handler: () => {
                            BattleSystem.startBattle(ENEMIES.tubeDude);
                            return '';
                        }
                    }, {
                        text: 'leave',
                        handler: () => {
                            MapSystem.renderMap();
                            MapSystem.renderSanity();
                            return 'you leave the tube dude alone';
                        }
                    }]
                });
                return '';
            }
        }]
    }
};