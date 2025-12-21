// js/ui.js
const UI = {
    lastRenderedUpdateId: null,

    render() {
        if (GameState.map.inMap) return;

        this.renderMainSection();
        this.renderSupplies();
        this.renderUpdates();
    },

    renderMainSection() {
        const container = document.getElementById('main-section');
        container.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'game-title';
        title.textContent = 'A Moderately-Lit Room';
        container.appendChild(title);

        switch(GameState.currentScreen) {
            case 'main': this.renderMainScreen(container); break;
            case 'mainHub': this.renderMainHubScreen(container); break;
            case 'craftsman': this.renderCraftsmanScreen(container); break;
            case 'junkDrawer': this.renderJunkDrawerScreen(container); break;
            case 'adventureMap': this.renderAdventureMapScreen(container); break;
        }
    },

    renderMainScreen(container) {
        const navRow1 = document.createElement('div');
        navRow1.className = 'button-row nav-row';

        const hubBtn = this.createButton('kitchen', () => Actions.switchScreen('mainHub'));
        if (!GameState.isScreenUnlocked('mainHub')) hubBtn.classList.add('hidden');
        navRow1.appendChild(hubBtn);

        const mapBtn = this.createButton('the cellar', () => Actions.switchScreen('adventureMap'));
        if (!GameState.isScreenUnlocked('adventureMap')) mapBtn.classList.add('hidden');
        navRow1.appendChild(mapBtn);

        container.appendChild(navRow1);

        let teaButtonText = 'make some tea';
        if (GameState.hasDefeatedTubeDude) {
            teaButtonText = 'make some tea with milk';
        }

        const mainAction = this.createMainActionButton(
            teaButtonText,
            () => Actions.makeTea(),
            GameState.cooldowns.mainAction,
            10
        );
        container.appendChild(mainAction);

        const navRow2 = document.createElement('div');
        navRow2.className = 'button-row nav-row';

        const craftsmanBtn = this.createButton('the banana man', () => Actions.switchScreen('craftsman'));
        if (!GameState.isScreenUnlocked('craftsman')) craftsmanBtn.classList.add('hidden');
        navRow2.appendChild(craftsmanBtn);

        const junkBtn = this.createButton('the rat', () => Actions.switchScreen('junkDrawer'));
        if (!GameState.isScreenUnlocked('junkDrawer')) junkBtn.classList.add('hidden');
        navRow2.appendChild(junkBtn);

        container.appendChild(navRow2);
    },

    renderMainHubScreen(container) {
        const section = document.createElement('div');
        section.className = 'section-container active';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = LOCATIONS[GameState.currentLocation].name;
        section.appendChild(title);

        const actionRow = document.createElement('div');
        actionRow.className = 'button-row';

        actionRow.appendChild(this.createButton('back', () => Actions.switchScreen('main')));

        let paperBtnText = 'gather paper';
        if (GameState.craftables.bicycle > 0) {
            paperBtnText = 'bicycle paper +15';
        }
        actionRow.appendChild(this.createCooldownButton(paperBtnText, () => Actions.gatherPaper(),
            GameState.cooldowns.gatherPrimary, 10));

        const griddles = GameState.craftables.griddles || 0;
        if (griddles > 0) {
            actionRow.appendChild(this.createCooldownButton(
                `cook with ${griddles} griddle${griddles !== 1 ? 's' : ''}`,
                () => Actions.cookWithGriddles(),
                GameState.cooldowns.cook, 20
            ));
        }

        section.appendChild(actionRow);

        // Rat section
        if (GameState.rats.total > 0) {
            const ratSection = document.createElement('div');
            ratSection.className = 'rat-section';

            const ratCount = document.createElement('span');
            ratCount.className = 'rat-count';
            ratCount.textContent = GameState.rats.total >= 7 ? 'all 7 rats' : `rats: ${GameState.rats.total}`;
            ratSection.appendChild(ratCount);

            const paperRatBtn = document.createElement('button');
            paperRatBtn.className = 'rat-button';
            paperRatBtn.textContent = `paper: ${GameState.rats.paper}`;
            paperRatBtn.onmousedown = (e) => { e.preventDefault(); GameState.moveRatToPaper(); UI.render(); };
            paperRatBtn.ontouchstart = (e) => { e.preventDefault(); GameState.moveRatToPaper(); UI.render(); };
            ratSection.appendChild(paperRatBtn);

            const griddleRatBtn = document.createElement('button');
            griddleRatBtn.className = 'rat-button';
            griddleRatBtn.textContent = `griddles: ${GameState.rats.griddles}`;
            griddleRatBtn.onmousedown = (e) => { e.preventDefault(); GameState.moveRatToGriddles(); UI.render(); };
            griddleRatBtn.ontouchstart = (e) => { e.preventDefault(); GameState.moveRatToGriddles(); UI.render(); };
            ratSection.appendChild(griddleRatBtn);

            section.appendChild(ratSection);
        }

        container.appendChild(section);
    },

    renderCraftsmanScreen(container) {
        const section = document.createElement('div');
        section.className = 'section-container active';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = 'The Banana Man';
        section.appendChild(title);

        const backRow = document.createElement('div');
        backRow.className = 'button-row';
        backRow.appendChild(this.createButton('back', () => Actions.switchScreen('main')));
        section.appendChild(backRow);

        const grid = document.createElement('div');
        grid.className = 'craftsman-grid';

        grid.appendChild(this.createCraftItem('bicycle', 'bicycle',
            Actions.getCraftCost('bicycle'), GameState.craftables.bicycle, 1));
        grid.appendChild(this.createCraftItem('griddles', 'griddle',
            Actions.getCraftCost('griddles'), GameState.craftables.griddles, Infinity));

        if (GameState.hasTriggeredEvent('junkDrawerUnlock')) {
            grid.appendChild(this.createCraftItem('junkDrawer', 'junk drawer',
                Actions.getCraftCost('junkDrawer'), GameState.craftables.junkDrawer, 1));
        }

        section.appendChild(grid);
        container.appendChild(section);
    },

    renderJunkDrawerScreen(container) {
        const section = document.createElement('div');
        section.className = 'section-container active';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = 'The Big Rat';
        section.appendChild(title);

        const backRow = document.createElement('div');
        backRow.className = 'button-row';
        backRow.appendChild(this.createButton('back', () => Actions.switchScreen('main')));
        section.appendChild(backRow);

        const grid = document.createElement('div');
        grid.className = 'junk-grid';

        // Cellar key always shows if not owned
        if (!GameState.hasCellarKey) {
            const keyItem = JUNK_ITEMS.cellarKey;
            const canAfford = GameState.hasResource('crumpets', keyItem.multiplier);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'junk-item';
            if (!canAfford) itemDiv.classList.add('disabled');

            const nameSpan = document.createElement('div');
            nameSpan.className = 'junk-item-name';
            nameSpan.textContent = keyItem.display;

            const priceSpan = document.createElement('div');
            priceSpan.className = 'junk-item-price';
            priceSpan.textContent = `${keyItem.multiplier} crumpets`;

            itemDiv.appendChild(nameSpan);
            itemDiv.appendChild(priceSpan);

            if (canAfford) {
                itemDiv.onmousedown = (e) => { e.preventDefault(); Actions.buyFromJunk('cellarKey', 1); };
                itemDiv.ontouchstart = (e) => { e.preventDefault(); Actions.buyFromJunk('cellarKey', 1); };
            }

            grid.appendChild(itemDiv);
        }

        // Show items player has EVER owned
        Object.keys(JUNK_ITEMS).forEach(key => {
            if (key === 'cellarKey') return;

            const item = JUNK_ITEMS[key];

            // Check if player has ever owned this item
            if (!GameState.everOwnedItems.includes(key)) return;

            const owned = GameState.resources[key] || 0;
            const maxOwned = item.maxOwned || Infinity;
            const crumpets = GameState.resources.crumpets || 0;
            const canAffordOne = crumpets >= item.multiplier;
            const atMax = owned >= maxOwned;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'junk-item';
            if (!canAffordOne || atMax) itemDiv.classList.add('disabled');

            const nameSpan = document.createElement('div');
            nameSpan.className = 'junk-item-name';
            nameSpan.textContent = item.display;

            const priceSpan = document.createElement('div');
            priceSpan.className = 'junk-item-price';
            priceSpan.textContent = atMax ? 'max' : `${item.multiplier} crumpets`;

            itemDiv.appendChild(nameSpan);
            itemDiv.appendChild(priceSpan);

            if (canAffordOne && !atMax) {
                itemDiv.onmousedown = (e) => { e.preventDefault(); this.showBuyPopup(key, item); };
                itemDiv.ontouchstart = (e) => { e.preventDefault(); this.showBuyPopup(key, item); };
            }

            grid.appendChild(itemDiv);
        });

        section.appendChild(grid);
        container.appendChild(section);
    },

    showBuyPopup(itemKey, item) {
        const crumpets = GameState.resources.crumpets || 0;
        const owned = GameState.resources[itemKey] || 0;
        const maxOwned = item.maxOwned || Infinity;
        const maxCanBuy = Math.min(
            Math.floor(crumpets / item.multiplier),
            maxOwned - owned
        );

        const quantities = [1, 5, 20, 50, 100].filter(q => q <= maxCanBuy);

        EventSystem.showEventPopup({
            title: `Buy ${item.display}`,
            message: `${item.multiplier} crumpets each`,
            options: quantities.map(q => ({
                text: `${q} (${q * item.multiplier} crumpets)`,
                handler: () => {
                    Actions.buyFromJunk(itemKey, q);
                    return `Bought ${q} ${item.display}`;
                }
            })).concat([{
                text: 'cancel',
                handler: () => {}
            }])
        });
    },

    renderAdventureMapScreen(container) {
        const section = document.createElement('div');
        section.className = 'section-container active';

        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = 'The Cellar';
        section.appendChild(title);

        // Show password hint if known and vault not unlocked
        if (GameState.knowsVaultPassword && !GameState.vaultUnlocked) {
            const hint = document.createElement('div');
            hint.className = 'cellar-hint';
            hint.textContent = `Password: ${GameState.vaultPassword}`;
            section.appendChild(hint);
        }

        // Show direction hint if rats granted power and vault not unlocked
        if (GameState.ratsGrantedPower && !GameState.vaultUnlocked && GameState.vaultDirection) {
            const dirHint = document.createElement('div');
            dirHint.className = 'cellar-hint';
            dirHint.textContent = `The rats say: look ${GameState.vaultDirection}`;
            section.appendChild(dirHint);
        }

        // Show refrigerator hint if applicable
        if (GameState.refrigeratorDirection && !GameState.map.clearedEvents.some(e => {
            const [x, y] = e.split(',').map(Number);
            return GameState.map.grid && GameState.map.grid[y] && GameState.map.grid[y][x] === 'F' &&
                MapSystem.refrigeratorPosition && x === MapSystem.refrigeratorPosition.x && y === MapSystem.refrigeratorPosition.y;
        })) {
            const fridgeHint = document.createElement('div');
            fridgeHint.className = 'cellar-hint';
            fridgeHint.textContent = `Refrigerator: ${GameState.refrigeratorDirection}`;
            section.appendChild(fridgeHint);
        }

        const actionRow = document.createElement('div');
        actionRow.className = 'button-row';

        actionRow.appendChild(this.createButton('back', () => Actions.switchScreen('main')));

        if (GameState.hasCellarKey) {
            actionRow.appendChild(this.createCooldownButton('embark', () => Actions.enterMap(),
                GameState.cooldowns.embark, 30));
        } else {
            const lockedBtn = this.createButton('need key', () => {});
            lockedBtn.disabled = true;
            actionRow.appendChild(lockedBtn);
        }

        section.appendChild(actionRow);
        container.appendChild(section);
    },

    createMainActionButton(text, onClick, currentCooldown, maxCooldown) {
        const container = document.createElement('div');
        container.className = 'main-action-container';

        const textElem = document.createElement('div');
        textElem.className = 'main-action-text';
        textElem.textContent = text;

        const lineContainer = document.createElement('div');
        lineContainer.className = 'main-action-line-container';

        const lineFill = document.createElement('div');
        lineFill.className = 'main-action-line-fill';

        const progress = Math.max(0, ((maxCooldown - currentCooldown) / maxCooldown) * 100);
        lineFill.style.width = `${progress}%`;

        lineContainer.appendChild(lineFill);
        container.appendChild(textElem);
        container.appendChild(lineContainer);

        if (currentCooldown === 0) {
            textElem.classList.add('ready');
            container.style.cursor = 'pointer';
            container.onmousedown = (e) => { e.preventDefault(); onClick(); };
            container.ontouchstart = (e) => { e.preventDefault(); onClick(); };
        }

        return container;
    },

    createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'game-button';

        const textSpan = document.createElement('span');
        textSpan.className = 'button-text';
        textSpan.textContent = text;
        btn.appendChild(textSpan);

        btn.onmousedown = (e) => { e.preventDefault(); onClick(); };
        btn.ontouchstart = (e) => { e.preventDefault(); onClick(); };
        return btn;
    },

    createCooldownButton(text, onClick, currentCooldown, maxCooldown) {
        const btn = document.createElement('button');
        btn.className = 'game-button';

        if (currentCooldown > 0) {
            btn.classList.add('on-cooldown');

            const fill = document.createElement('div');
            fill.className = 'cooldown-fill';
            const progress = ((maxCooldown - currentCooldown) / maxCooldown) * 100;
            fill.style.width = `${progress}%`;
            btn.appendChild(fill);
        } else {
            btn.onmousedown = (e) => { e.preventDefault(); onClick(); };
            btn.ontouchstart = (e) => { e.preventDefault(); onClick(); };
        }

        const textSpan = document.createElement('span');
        textSpan.className = 'button-text';
        textSpan.textContent = text;
        btn.appendChild(textSpan);

        return btn;
    },

    createCraftItem(id, name, costs, owned, maxOwned) {
        const item = document.createElement('div');
        item.className = 'craft-item';

        const isMaxed = owned >= maxOwned;

        let canAfford = true;
        if (!isMaxed) {
            for (let resource in costs) {
                if (!GameState.hasResource(resource, costs[resource])) {
                    canAfford = false;
                    break;
                }
            }
        }

        if (isMaxed) {
            item.classList.add('maxed');
        } else if (!canAfford) {
            item.classList.add('disabled');
        }

        const nameElem = document.createElement('div');
        nameElem.className = 'craft-item-name';
        nameElem.textContent = name;
        item.appendChild(nameElem);

        if (!isMaxed) {
            for (let resource in costs) {
                const costElem = document.createElement('div');
                costElem.className = 'craft-item-cost';
                costElem.textContent = `${ITEMS[resource].display}: ${costs[resource]}`;
                item.appendChild(costElem);
            }
        }

        if (owned > 0 && maxOwned === Infinity) {
            const countElem = document.createElement('div');
            countElem.className = 'craft-item-count';
            countElem.textContent = `owned: ${owned}`;
            item.appendChild(countElem);
        }

        if (isMaxed) {
            const maxedElem = document.createElement('div');
            maxedElem.className = 'craft-item-maxed';
            maxedElem.textContent = '(max)';
            item.appendChild(maxedElem);
        }

        if (canAfford && !isMaxed) {
            item.onmousedown = (e) => { e.preventDefault(); Actions.craftItem(id); };
            item.ontouchstart = (e) => { e.preventDefault(); Actions.craftItem(id); };
        }

        return item;
    },

    renderSupplies() {
        const container = document.getElementById('supplies-section');
        container.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'supplies-grid';

        const displayOrder = ['paper', 'crumpets', 'mysteryLumps', 'shrimps', 'dragonDragon'];

        displayOrder.forEach(resourceKey => {
            const amount = GameState.resources[resourceKey] || 0;
            if (amount > 0 || resourceKey === 'paper') {
                const item = document.createElement('span');
                item.className = 'supply-item';

                const name = document.createElement('span');
                name.className = 'supply-name';
                name.textContent = ITEMS[resourceKey].display + ': ';

                const amountElem = document.createElement('span');
                amountElem.className = 'supply-amount';
                amountElem.textContent = amount;

                item.appendChild(name);
                item.appendChild(amountElem);
                grid.appendChild(item);
            }
        });

        container.appendChild(grid);
    },

    renderUpdates() {
        const list = document.getElementById('updates-list');

        if (GameState.updates.length === 0) {
            list.innerHTML = '';
            return;
        }

        const newestId = GameState.updates[0].id;
        const isNewUpdate = newestId !== this.lastRenderedUpdateId;

        list.innerHTML = '';

        GameState.updates.forEach((update, index) => {
            const item = document.createElement('div');
            item.className = 'update-item';
            item.textContent = update.message;

            if (index === 0 && isNewUpdate) {
                item.classList.add('new');
            }

            list.appendChild(item);
        });

        this.lastRenderedUpdateId = newestId;
    }
};