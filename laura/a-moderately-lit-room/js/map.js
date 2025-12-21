// js/map.js
const MapSystem = {
    MAP_SIZE: 21,
    VISIBILITY_RADIUS: 2,
    HOME_X: 10,
    HOME_Y: 10,
    MAX_SANITY: 10,

    currentMathAnswer: 0,
    currentEventPos: null,
    processingMove: false,

    vaultPosition: null,
    shrimpShackPosition: null,
    marshmallowPosition: null,
    refrigeratorPosition: null,

    RING_EVENTS: {
        2: ['R', 'R'],
        3: ['D', 'R', 'R', 'R', 'R', 'X', 'M'],  // Added M here
        4: ['R'],
        7: ['Z']
    },

    generateMap() {
        const grid = [];
        const events = [];
        const revealed = [];

        for (let y = 0; y < this.MAP_SIZE; y++) {
            grid[y] = [];
            events[y] = [];
            revealed[y] = [];
            for (let x = 0; x < this.MAP_SIZE; x++) {
                grid[y][x] = '.';
                events[y][x] = null;
                revealed[y][x] = false;
            }
        }

        grid[this.HOME_Y][this.HOME_X] = 'A';

        for (let ring in this.RING_EVENTS) {
            const ringNum = parseInt(ring);
            const eventList = [...this.RING_EVENTS[ring]];
            const ringCells = this.getRingCells(ringNum);

            eventList.forEach(eventType => {
                if (ringCells.length > 0) {
                    const idx = Math.floor(Math.random() * ringCells.length);
                    const cell = ringCells.splice(idx, 1)[0];
                    events[cell.y][cell.x] = eventType;
                    grid[cell.y][cell.x] = eventType;

                    if (eventType === 'Z') {
                        this.vaultPosition = { x: cell.x, y: cell.y };
                        GameState.vaultDirection = GameState.getCompassDirection(
                            this.HOME_X, this.HOME_Y, cell.x, cell.y
                        );
                    }
                    if (eventType === 'X') {
                        this.marshmallowPosition = { x: cell.x, y: cell.y };
                    }
                }
            });
        }

        // Place shrimp shack near vault
        if (this.vaultPosition) {
            const nearVaultCells = [];
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const x = this.vaultPosition.x + dx;
                    const y = this.vaultPosition.y + dy;
                    if (x >= 0 && x < this.MAP_SIZE && y >= 0 && y < this.MAP_SIZE) {
                        if (grid[y][x] === '.' && !(x === this.HOME_X && y === this.HOME_Y)) {
                            nearVaultCells.push({ x, y });
                        }
                    }
                }
            }
            if (nearVaultCells.length > 0) {
                const cell = nearVaultCells[Math.floor(Math.random() * nearVaultCells.length)];
                grid[cell.y][cell.x] = 'H';
                events[cell.y][cell.x] = 'H';
                this.shrimpShackPosition = { x: cell.x, y: cell.y };
            }
        }

        return { grid, events, revealed };
    },

    restoreSpecialPositions() {
        // Scan grid to restore special position references
        for (let y = 0; y < this.MAP_SIZE; y++) {
            for (let x = 0; x < this.MAP_SIZE; x++) {
                const cell = GameState.map.grid[y][x];
                if (cell === 'Z') {
                    this.vaultPosition = { x, y };
                } else if (cell === 'X') {
                    this.marshmallowPosition = { x, y };
                } else if (cell === 'H') {
                    this.shrimpShackPosition = { x, y };
                } else if (cell === 'F') {
                    this.refrigeratorPosition = { x, y };
                }
            }
        }
    },

    placeRefrigerator() {
        if (GameState.refrigeratorPlaced || !GameState.map.grid) return;

        const edgeCells = [];
        for (let i = 0; i < this.MAP_SIZE; i++) {
            if (GameState.map.grid[0][i] === '.') edgeCells.push({ x: i, y: 0 });
            if (GameState.map.grid[this.MAP_SIZE - 1][i] === '.') edgeCells.push({ x: i, y: this.MAP_SIZE - 1 });
            if (GameState.map.grid[i][0] === '.') edgeCells.push({ x: 0, y: i });
            if (GameState.map.grid[i][this.MAP_SIZE - 1] === '.') edgeCells.push({ x: this.MAP_SIZE - 1, y: i });
        }

        if (edgeCells.length > 0) {
            const cell = edgeCells[Math.floor(Math.random() * edgeCells.length)];
            GameState.map.grid[cell.y][cell.x] = 'F';
            GameState.map.events[cell.y][cell.x] = 'F';
            this.refrigeratorPosition = { x: cell.x, y: cell.y };
            GameState.refrigeratorDirection = GameState.getCompassDirection(
                this.HOME_X, this.HOME_Y, cell.x, cell.y
            );
            GameState.refrigeratorPlaced = true;
        }
    },

    getRingCells(ring) {
        const cells = [];
        for (let y = 0; y < this.MAP_SIZE; y++) {
            for (let x = 0; x < this.MAP_SIZE; x++) {
                const dist = Math.max(Math.abs(x - this.HOME_X), Math.abs(y - this.HOME_Y));
                if (dist === ring) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    },

    enterMap() {
        if (!GameState.map.grid) {
            const mapData = this.generateMap();
            GameState.map.grid = mapData.grid;
            GameState.map.events = mapData.events;
            GameState.map.revealed = mapData.revealed;
        }

        // Restore cleared events
        GameState.map.clearedEvents.forEach(pos => {
            const [x, y] = pos.split(',').map(Number);
            if (GameState.map.grid[y] && GameState.map.grid[y][x]) {
                const originalEvent = GameState.map.events[y][x];
                GameState.map.grid[y][x] = originalEvent || '$';
            }
        });

        this.restoreSpecialPositions();

        GameState.map.playerX = this.HOME_X;
        GameState.map.playerY = this.HOME_Y;
        GameState.map.sanity = this.MAX_SANITY;
        GameState.map.completedThisTrip = [];
        GameState.map.usedSafeSpotsThisTrip = [];
        GameState.map.shrimpShackUsedThisTrip = false;
        GameState.map.inMap = true;
        GameState.map.movesSinceEncounter = 0;
        GameState.map.stepsSinceSanityLoss = 0;

        this.revealAround(GameState.map.playerX, GameState.map.playerY);

        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('map-container').classList.add('active');

        this.renderMap();
        this.renderSanity();
        this.setupControls();
    },

    exitMap() {
        GameState.map.inMap = false;

        // Save map state
        GameState.map.savedGridState = GameState.map.grid;
        GameState.map.savedRevealedState = GameState.map.revealed;
        GameState.map.savedEventsState = GameState.map.events;

        document.getElementById('map-container').classList.remove('active');
        document.getElementById('game-container').classList.remove('hidden');

        this.removeControls();

        // Check for all rats found
        if (GameState.rats.total >= 7 && !GameState.allRatsFoundNotified) {
            GameState.allRatsFoundNotified = true;
            setTimeout(() => {
                EventSystem.showEventPopup({
                    title: EVENT_TEMPLATES.allRatsFound.title,
                    message: EVENT_TEMPLATES.allRatsFound.message,
                    options: [{ text: 'continue', handler: () => {
                            GameState.pendingRatsPower = true;
                            UI.render();
                        }}]
                });
            }, 500);
            return;
        }

// Check for marshmallow victory
        if (GameState.pendingMarshmallowVictory) {
            GameState.pendingMarshmallowVictory = false;
            this.placeRefrigerator();
            setTimeout(() => {
                EventSystem.showEventPopup({
                    title: 'The Marshmallow Secret',
                    message: `As the marshmallow dissolves, a message appears: "Find the refrigerator to the ${GameState.refrigeratorDirection}..."`,
                    options: [{ text: 'continue', handler: () => {
                            UI.render();
                        }}]
                });
            }, 500);
            return;
        }


        UI.render();
    },

    bootFromMap(reason) {
        GameState.addUpdate(reason || 'You lost your sanity and fled the cellar.');

        // Call exitMap to handle state saving, UI changes, and popups
        this.exitMap();
    },

    useShrimpShack() {
        GameState.map.shrimpShackUsedThisTrip = true;
    },

    setupControls() {
        this.removeControls();

        const arrowPad = document.getElementById('arrow-pad');
        const buttons = arrowPad.querySelectorAll('.arrow-btn[data-dir]');

        this.handleArrowDown = (e) => {
            e.preventDefault();
            if (this.processingMove) return;

            const dir = e.currentTarget.dataset.dir;
            if (dir) {
                this.processingMove = true;
                this.movePlayer(dir);
                setTimeout(() => {
                    this.processingMove = false;
                }, 150);
            }
        };

        buttons.forEach(btn => {
            btn.addEventListener('mousedown', this.handleArrowDown);
            btn.addEventListener('touchstart', this.handleArrowDown);
        });

        this.handleKeyDown = (e) => {
            if (this.processingMove) return;

            let dir = null;
            switch(e.key) {
                case 'ArrowUp': case 'w': case 'W': dir = 'up'; break;
                case 'ArrowDown': case 's': case 'S': dir = 'down'; break;
                case 'ArrowLeft': case 'a': case 'A': dir = 'left'; break;
                case 'ArrowRight': case 'd': case 'D': dir = 'right'; break;
            }

            if (dir) {
                e.preventDefault();
                this.processingMove = true;
                this.movePlayer(dir);
                setTimeout(() => {
                    this.processingMove = false;
                }, 150);
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);
    },

    removeControls() {
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }

        const arrowPad = document.getElementById('arrow-pad');
        if (arrowPad) {
            const buttons = arrowPad.querySelectorAll('.arrow-btn[data-dir]');
            buttons.forEach(btn => {
                btn.removeEventListener('mousedown', this.handleArrowDown);
                btn.removeEventListener('touchstart', this.handleArrowDown);
            });
        }
    },

    movePlayer(direction) {
        let newX = GameState.map.playerX;
        let newY = GameState.map.playerY;

        switch(direction) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }

        if (newX < 0 || newX >= this.MAP_SIZE || newY < 0 || newY >= this.MAP_SIZE) {
            return;
        }

        const wasAtHome = (GameState.map.playerX === this.HOME_X && GameState.map.playerY === this.HOME_Y);

        GameState.map.playerX = newX;
        GameState.map.playerY = newY;
        GameState.map.movesSinceEncounter++;

        // Sanity loss - 2 steps per 1 sanity if rats power granted
        GameState.map.stepsSinceSanityLoss++;
        const stepsPerSanity = GameState.ratsGrantedPower ? 2 : 1;
        if (GameState.map.stepsSinceSanityLoss >= stepsPerSanity) {
            GameState.map.sanity--;
            GameState.map.stepsSinceSanityLoss = 0;
        }

        this.revealAround(newX, newY);

        if (!wasAtHome && newX === this.HOME_X && newY === this.HOME_Y) {
            GameState.addUpdate('Returned from the cellar.');
            this.exitMap();
            return;
        }

        // Check for event first - events take priority
        const event = GameState.map.events[newY][newX];
        const gridSymbol = GameState.map.grid[newY][newX];
        const posKey = `${newX},${newY}`;

        // First render the map to show the player has moved
        this.renderMap();
        this.renderSanity();

        if (event && !GameState.map.clearedEvents.includes(posKey)) {
            if (event === 'H') {
                if (!GameState.map.shrimpShackUsedThisTrip) {
                    this.currentEventPos = posKey;
                    this.triggerMapEvent(event, newX, newY);
                    return;
                }
            } else if (event === 'X') {
                if (!GameState.marshmallowDefeated) {
                    this.currentEventPos = posKey;
                    this.triggerMapEvent(event, newX, newY);
                    return;
                }
            } else if (!GameState.map.completedThisTrip.includes(posKey)) {
                this.currentEventPos = posKey;
                this.triggerMapEvent(event, newX, newY);
                return;
            }
        }

        // Random encounter only on non-event spaces
        if (!DEBUG.disableRandomEncounters && gridSymbol === '.') {
            const dist = Math.max(Math.abs(newX - this.HOME_X), Math.abs(newY - this.HOME_Y));
            let enemy = null;

            // Select enemy based on distance
            if (dist <= 3) {
                const enemies = ['bigSpooky', 'notNiceRat', 'leakyPipe'];
                enemy = ENEMIES[enemies[Math.floor(Math.random() * enemies.length)]];
            } else if (dist <= 6) {
                const enemies = ['goblin', 'christmasDecorations', 'spider'];
                enemy = ENEMIES[enemies[Math.floor(Math.random() * enemies.length)]];
            } else {
                const enemies = ['bigBug'];
                enemy = ENEMIES[enemies[Math.floor(Math.random() * enemies.length)]];
            }

            const encounterChance = 0.05 + (0.05 * GameState.map.movesSinceEncounter);
            if (Math.random() < encounterChance && enemy) {
                GameState.map.movesSinceEncounter = 0;
                BattleSystem.showIntro(enemy);
                return;
            }
        }

        if (GameState.map.sanity <= 0) {
            this.bootFromMap();
            return;
        }
    },

    triggerMapEvent(eventType, x, y) {
        const eventDef = MAP_EVENTS[eventType];
        if (!eventDef) return;

        if (eventDef.isVault) {
            this.showVaultPuzzle();
            return;
        }

        if (eventDef.isBattle) {
            EventSystem.showEventPopup({
                title: eventDef.title,
                message: eventDef.getMessage(),
                options: eventDef.getOptions()
            });
            return;
        }

        const message = eventDef.getMessage();
        const options = eventDef.getOptions();

        EventSystem.showEventPopup({
            title: eventDef.title,
            message: message,
            options: options.map(opt => ({
                text: opt.text,
                handler: () => {
                    const result = opt.handler();
                    GameState.addUpdate(result);
                    this.renderMap();
                    this.renderSanity();
                }
            }))
        });
    },

    showVaultPuzzle() {
        const overlay = document.getElementById('popup-overlay');
        const titleElem = document.getElementById('popup-title');
        const messageElem = document.getElementById('popup-message');
        const extraElem = document.getElementById('popup-extra');
        const buttonsContainer = document.getElementById('popup-buttons');

        titleElem.textContent = 'The Secret Vault';
        messageElem.textContent = 'An iron box with a rusty combination lock. It hasn\'t been used in a long time.';

        // Start each dial on a random letter
        const currentGuess = VAULT_DIAL_OPTIONS.map(options =>
            options[Math.floor(Math.random() * options.length)]
        );

        const renderDials = () => {
            extraElem.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'vault-container';

            const dialsRow = document.createElement('div');
            dialsRow.className = 'vault-dials';

            for (let i = 0; i < 6; i++) {
                const dial = document.createElement('div');
                dial.className = 'vault-dial';
                dial.textContent = currentGuess[i];
                dial.dataset.index = i;

                dial.onmousedown = (e) => {
                    e.preventDefault();
                    const idx = parseInt(dial.dataset.index);
                    const options = VAULT_DIAL_OPTIONS[idx];
                    const currentIdx = options.indexOf(currentGuess[idx]);
                    const nextIdx = (currentIdx + 1) % options.length;
                    currentGuess[idx] = options[nextIdx];
                    renderDials();
                    checkSolution();
                };
                dial.ontouchstart = dial.onmousedown;

                dialsRow.appendChild(dial);
            }

            container.appendChild(dialsRow);

            const status = document.createElement('div');
            status.className = 'vault-status';
            status.textContent = 'tap each dial to cycle letters';
            container.appendChild(status);

            extraElem.appendChild(container);
        };

        const checkSolution = () => {
            const guess = currentGuess.join('');
            if (guess === GameState.vaultPassword) {
                const dials = extraElem.querySelectorAll('.vault-dial');
                dials.forEach(d => d.classList.add('correct'));

                setTimeout(() => {
                    overlay.classList.add('hidden');
                    extraElem.innerHTML = '';

                    GameState.hasSubmachineGun = true;
                    GameState.vaultUnlocked = true;
                    GameState.knowsVaultPassword = false;
                    GameState.vaultDirection = null;
                    MapSystem.completeCurrentEvent();

                    EventSystem.showEventPopup({
                        title: 'Vault Unlocked!',
                        message: 'Inside it was the shrimpstrike submachine gun! Your shrimp throw speed has increased!',
                        options: [{
                            text: 'awesome',
                            handler: () => {
                                GameState.addUpdate('Found the shrimpstrike submachine gun!');
                                return '';
                            }
                        }]
                    });
                }, 2000);
            }
        };

        buttonsContainer.innerHTML = '';
        const leaveBtn = document.createElement('button');
        leaveBtn.className = 'popup-btn';
        leaveBtn.textContent = 'leave';
        leaveBtn.onmousedown = (e) => {
            e.preventDefault();
            overlay.classList.add('hidden');
            extraElem.innerHTML = '';
            MapSystem.renderMap();
            MapSystem.renderSanity();
        };
        leaveBtn.ontouchstart = leaveBtn.onmousedown;
        buttonsContainer.appendChild(leaveBtn);

        renderDials();
        overlay.classList.remove('hidden');
    },

    completeCurrentEvent() {
        if (this.currentEventPos) {
            GameState.map.completedThisTrip.push(this.currentEventPos);
            GameState.map.clearedEvents.push(this.currentEventPos);

            // DO NOT restore sanity on clearing events
            this.currentEventPos = null;

            // Force render to update map display
            this.renderMap();
        }
    },

    markSafeSpotUsed() {
        if (this.currentEventPos) {
            GameState.map.usedSafeSpotsThisTrip.push(this.currentEventPos);
            this.currentEventPos = null;
        }
    },

    revealAround(x, y) {
        for (let dy = -this.VISIBILITY_RADIUS; dy <= this.VISIBILITY_RADIUS; dy++) {
            for (let dx = -this.VISIBILITY_RADIUS; dx <= this.VISIBILITY_RADIUS; dx++) {
                if (Math.abs(dx) + Math.abs(dy) <= this.VISIBILITY_RADIUS) {
                    const revealX = x + dx;
                    const revealY = y + dy;

                    if (revealX >= 0 && revealX < this.MAP_SIZE &&
                        revealY >= 0 && revealY < this.MAP_SIZE) {
                        GameState.map.revealed[revealY][revealX] = true;
                    }
                }
            }
        }
    },

    renderMap() {
        const display = document.getElementById('map-display');
        const viewSize = 11;
        const halfView = Math.floor(viewSize / 2);

        let viewStartX = GameState.map.playerX - halfView;
        let viewStartY = GameState.map.playerY - halfView;

        if (viewStartX < 0) viewStartX = 0;
        if (viewStartY < 0) viewStartY = 0;
        if (viewStartX + viewSize > this.MAP_SIZE) viewStartX = this.MAP_SIZE - viewSize;
        if (viewStartY + viewSize > this.MAP_SIZE) viewStartY = this.MAP_SIZE - viewSize;

        let html = '';

        for (let viewY = 0; viewY < viewSize; viewY++) {
            for (let viewX = 0; viewX < viewSize; viewX++) {
                const mapX = viewStartX + viewX;
                const mapY = viewStartY + viewY;

                const isPlayer = (mapX === GameState.map.playerX && mapY === GameState.map.playerY);
                const isRevealed = GameState.map.revealed[mapY][mapX];
                const cell = GameState.map.grid[mapY][mapX];
                const posKey = `${mapX},${mapY}`;
                const isCleared = GameState.map.clearedEvents.includes(posKey);

                let charClass = 'map-char';
                let displayChar = ' ';

                if (isPlayer) {
                    charClass += ' player';
                    displayChar = '@';
                } else if (isRevealed) {
                    charClass += ' visible';
                    displayChar = cell;

                    if (cell === 'A') {
                        charClass += ' home';
                    } else if (['R', 'D', 'S', 'M', 'Z', 'X', 'H', 'F'].includes(cell)) {
                        if (isCleared) {
                            charClass += ' cleared';
                        } else {
                            charClass += ` event-${cell}`;
                        }
                    }
                } else {
                    charClass += ' hidden';
                    displayChar = ' ';
                }

                html += `<span class="${charClass}">${displayChar}</span>`;
            }
            html += '\n';
        }

        display.innerHTML = html;
    },

    renderSanity() {
        const container = document.getElementById('sanity-container');
        let html = '<span class="sanity-label">sanity</span><div class="sanity-bar">';

        for (let i = 0; i < this.MAX_SANITY; i++) {
            const filled = i < GameState.map.sanity;
            html += `<div class="sanity-pip${filled ? '' : ' empty'}"></div>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }
};