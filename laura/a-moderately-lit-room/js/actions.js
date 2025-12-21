// js/actions.js
const Actions = {
    makeTea() {
        if (GameState.cooldowns.mainAction > 0) return;

        GameState.cooldowns.mainAction = 10;

        if (!GameState.teaClicks) {
            GameState.teaClicks = 0;
        }

        GameState.teaClicks++;

        if (GameState.teaClicks === 1) {
            setTimeout(() => {
                EventSystem.showEventPopup({
                    title: 'Making Tea',
                    message: 'I wish I had some milk...probably in the fridge',
                    options: [{ text: 'ok', handler: () => {} }]
                });
            }, 500); // 1 second
            return;
        }

        if (GameState.teaClicks === 2) {
            setTimeout(() => {
                EventSystem.showEventPopup({
                    title: 'Making Tea',
                    message: 'Hmm...where did I put it?',
                    options: [{
                        text: 'continue',
                        handler: () => {
                            GameState.unlockScreen('mainHub');
                            GameState.triggerEvent('mainHubUnlocked');
                            GameState.tickCount = 0;
                            UI.render();
                        }
                    }]
                });
            }, 500);
            return;
    } else if (GameState.hasDefeatedTubeDude) {
            const endTime = Date.now();
            const playTime = Math.floor((endTime - GameState.gameStartTime) / 1000);
            const minutes = Math.floor(playTime / 60);
            const seconds = playTime % 60;

            EventSystem.showEventPopup({
                title: 'Victory!',
                message: `That's it! Time: ${minutes}m ${seconds}s. You make some delicious tea.`,
                options: [{ text: 'hooray!', handler: () => {} }]
            });
            return;
        }

        GameState.addUpdate('You made some tea. How delightful!');
        GameState.save(false);
    },

    gatherPaper() {
        if (GameState.cooldowns.gatherPrimary > 0) return;

        const location = LOCATIONS[GameState.currentLocation];
        const baseAmount = location.primaryAmount;
        const bicycleBonus = GameState.craftables.bicycle > 0 ? 10 : 0;
        const totalAmount = baseAmount + bicycleBonus;

        GameState.addResource('paper', totalAmount);
        GameState.cooldowns.gatherPrimary = location.primaryCooldown;
        GameState.addUpdate(`Gathered ${totalAmount} paper.`);
    },

    cookWithGriddles() {
        if (GameState.cooldowns.cook > 0) return;

        const griddles = GameState.craftables.griddles;
        if (griddles === 0) return;

        const location = LOCATIONS[GameState.currentLocation];
        const results = {};

        for (let i = 0; i < griddles; i++) {
            location.secondaryResources.forEach(resource => {
                if (Math.random() <= resource.chance) {
                    const amount = Math.floor(Math.random() * (resource.max - resource.min + 1)) + resource.min;
                    GameState.addResource(resource.name, amount);
                    results[resource.name] = (results[resource.name] || 0) + amount;
                }
            });
        }

        const parts = [];
        if (results.crumpets > 0) {
            parts.push(`${results.crumpets} crumpet${results.crumpets !== 1 ? 's' : ''}`);
        }
        if (results.mysteryLumps > 0) {
            parts.push(`${results.mysteryLumps} mystery lump${results.mysteryLumps !== 1 ? 's' : ''}`);
        }

        if (parts.length > 0) {
            GameState.addUpdate(`Cooked ${parts.join(' and ')}.`);
        } else {
            GameState.addUpdate('The griddles produced nothing this time.');
        }

        GameState.cooldowns.cook = 20;
    },

    craftItem(itemName) {
        if (!GameState.canCraft(itemName)) {
            GameState.addUpdate('Already at maximum.');
            return;
        }

        const costs = this.getCraftCost(itemName);

        let canAfford = true;
        for (let resource in costs) {
            if (!GameState.hasResource(resource, costs[resource])) {
                canAfford = false;
                break;
            }
        }

        if (!canAfford) {
            GameState.addUpdate('Not enough resources.');
            return;
        }

        for (let resource in costs) {
            GameState.removeResource(resource, costs[resource]);
        }

        GameState.craftables[itemName] =
            (GameState.craftables[itemName] || 0) + 1;

        const displayNames = {
            bicycle: 'bicycle',
            griddles: 'griddle',
            junkDrawer: 'junk drawer'
        };
        GameState.addUpdate(`Crafted a ${displayNames[itemName]}!`);

        // bicycle popup
        if (itemName === 'bicycle') {
            setTimeout(() => {
                EventSystem.showEventPopup({
                    title: 'Speedy Paper',
                    message: 'This should let me get paper a lot faster.',
                    options: [{ text: 'continue', handler: () => {} }]
                });
            }, 500);
        }

        // junk drawer popup + unlock
        if (itemName === 'junkDrawer') {
            GameState.unlockScreen('junkDrawer');

            setTimeout(() => {
                EventSystem.showEventPopup({
                    title: 'A Place for Everything',
                    message: 'Who knows what you\'ll find...',
                    options: [{ text: 'continue', handler: () => {} }]
                });
            }, 500);
        }

        UI.render();
    },

    getCraftCost(itemName) {
        switch(itemName) {
            case 'bicycle':
                return { paper: 30 };
            case 'griddles':
                const currentGriddles = GameState.craftables.griddles || 0;
                return { paper: 10 + (currentGriddles * 5) };
            case 'junkDrawer':
                return { paper: 50, crumpets: 50 };
            default:
                return {};
        }
    },

    buyFromJunk(itemName, quantity) {
        const item = JUNK_ITEMS[itemName];
        if (!item) return;

        const totalCost = item.multiplier * quantity;

        if (!GameState.hasResource('crumpets', totalCost)) {
            GameState.addUpdate('Not enough crumpets.');
            return;
        }

        const maxOwned = item.maxOwned || Infinity;
        const current = GameState.resources[itemName] || 0;
        const canBuy = Math.min(quantity, maxOwned - current);

        if (canBuy <= 0) {
            GameState.addUpdate('Already have maximum.');
            return;
        }

        const actualCost = item.multiplier * canBuy;
        GameState.removeResource('crumpets', actualCost);

        if (itemName === 'cellarKey') {
            GameState.hasCellarKey = true;
            GameState.triggerEvent('cellarUnlock');
            GameState.unlockScreen('adventureMap');
            GameState.randomEventsEnabled = true;
            GameState.resetRandomEventTimer();
            setTimeout(() => {
                EventSystem.showEventPopup({
                    title: EVENT_TEMPLATES.cellarUnlock.title,
                    message: EVENT_TEMPLATES.cellarUnlock.message,
                    options: [{ text: 'continue', handler: () => {} }]
                });
            }, 500);
        } else {
            GameState.addResource(itemName, canBuy);
            GameState.addUpdate(`Bought ${canBuy} ${item.display}.`);
        }
        UI.render();
    },

    switchScreen(screenName) {
        if (GameState.isScreenUnlocked(screenName)) {
            GameState.currentScreen = screenName;
            UI.render();
        }
    },

    enterMap() {
        if (GameState.cooldowns.embark > 0) return;
        if (!GameState.hasCellarKey) {
            GameState.addUpdate('You need the cellar key.');
            return;
        }
        MapSystem.enterMap();
    },

    exitMap() {
        MapSystem.exitMap();
    }
};