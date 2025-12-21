// js/state.js
const GameState = {
    currentScreen: 'main',
    tickCount: 0,
    unlockedScreens: ['main'],
    teaClicks: 0,
    gameStartTime: Date.now(),

    resources: {
        paper: 0,
        crumpets: 0,
        mysteryLumps: 0,
        shrimps: 0,
        dragonDragon: 0
    },

    craftables: {
        bicycle: 0,
        griddles: 0,
        junkDrawer: 0
    },

    craftLimits: {
        bicycle: 1,
        griddles: Infinity,
        junkDrawer: 1
    },

    cooldowns: {
        mainAction: 0,
        gatherPrimary: 0,
        cook: 0,
        embark: 0
    },

    triggeredEvents: [],
    updates: [],
    lastRenderedUpdateId: null,
    currentLocation: 'kitchen',

    randomEventTimer: 0,
    randomEventsEnabled: false,

    hasCellarKey: false,
    hasSubmachineGun: false,
    knowsVaultPassword: false,
    vaultPassword: null,
    vaultUnlocked: false,
    vaultDirection: null,
    hasDefeatedTubeDude: false,
    hasSeenSnorfley: false,

    marshmallowDefeated: false,
    refrigeratorDirection: null,
    refrigeratorPlaced: false,

    allRatsFoundNotified: false,
    ratsGrantedPower: false,
    pendingRatsPower: false,
    pendingMarshmallowVictory: false,

    consecutiveLosses: 0,
    everOwnedItems: [],

    rats: {
        total: 0,
        paper: 0,
        griddles: 0
    },

    ratTickCounter: 0,

    map: {
        grid: null,
        revealed: null,
        events: null,
        clearedEvents: [],
        completedThisTrip: [],
        usedSafeSpotsThisTrip: [],
        shrimpShackUsedThisTrip: false,
        playerX: 10,
        playerY: 10,
        sanity: 10,
        inMap: false,
        movesSinceEncounter: 0,
        stepsSinceSanityLoss: 0
    },

    init() {
        this.gameStartTime = Date.now();
        const saved = localStorage.getItem('darkRoomSave');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.loadFromSave(parsed);
                this.addUpdate('Game loaded.');
            } catch (e) {
                console.error('Failed to load save:', e);
                this.reset();
            }
        } else {
            this.reset();
        }
    },

    loadFromSave(data) {
        this.currentScreen = data.currentScreen || 'main';
        this.tickCount = data.tickCount || 0;
        this.teaClicks = data.teaClicks || 0;
        this.gameStartTime = data.gameStartTime || Date.now();
        this.unlockedScreens = data.unlockedScreens || ['main'];
        this.resources = { ...this.getDefaultResources(), ...data.resources };
        this.craftables = { bicycle: 0, griddles: 0, junkDrawer: 0, ...data.craftables };
        this.cooldowns = { mainAction: 0, gatherPrimary: 0, cook: 0, embark: 0, ...data.cooldowns };
        this.triggeredEvents = data.triggeredEvents || [];
        this.updates = data.updates || [];
        this.currentLocation = data.currentLocation || 'kitchen';
        this.randomEventTimer = data.randomEventTimer || 0;
        this.randomEventsEnabled = data.randomEventsEnabled || false;
        this.hasCellarKey = data.hasCellarKey || false;
        this.hasSubmachineGun = data.hasSubmachineGun || false;
        this.knowsVaultPassword = data.knowsVaultPassword || false;
        this.vaultPassword = data.vaultPassword || this.generateVaultPassword();
        this.vaultUnlocked = data.vaultUnlocked || false;
        this.vaultDirection = data.vaultDirection || null;
        this.hasDefeatedTubeDude = data.hasDefeatedTubeDude || false;
        this.hasSeenSnorfley = data.hasSeenSnorfley || false;
        this.marshmallowDefeated = data.marshmallowDefeated || false;
        this.refrigeratorDirection = data.refrigeratorDirection || null;
        this.refrigeratorPlaced = data.refrigeratorPlaced || false;
        this.allRatsFoundNotified = data.allRatsFoundNotified || false;
        this.ratsGrantedPower = data.ratsGrantedPower || false;
        this.pendingRatsPower = data.pendingRatsPower || false;
        this.pendingMarshmallowVictory = data.pendingMarshmallowVictory || false;
        this.consecutiveLosses = data.consecutiveLosses || 0;
        this.everOwnedItems = data.everOwnedItems || [];
        this.rats = data.rats || { total: 0, paper: 0, griddles: 0 };
        this.ratTickCounter = data.ratTickCounter || 0;

        // Properly restore map state
        this.map = {
            grid: data.map?.grid || null,
            revealed: data.map?.revealed || null,
            events: data.map?.events || null,
            clearedEvents: data.map?.clearedEvents || [],
            completedThisTrip: [],
            usedSafeSpotsThisTrip: [],
            shrimpShackUsedThisTrip: false,
            playerX: 10,
            playerY: 10,
            sanity: 10,
            inMap: false,
            movesSinceEncounter: 0,
            stepsSinceSanityLoss: 0
        };

        // Restore vault and special positions if map exists
        if (this.map.grid) {
            MapSystem.restoreSpecialPositions();
        }
    },

    generateVaultPassword() {
        return VAULT_PASSWORDS[Math.floor(Math.random() * VAULT_PASSWORDS.length)];
    },

    getDefaultResources() {
        return {
            paper: 0,
            crumpets: 0,
            mysteryLumps: 0,
            shrimps: 0,
            dragonDragon: 0
        };
    },

    reset() {
        this.currentScreen = 'main';
        this.tickCount = 0;
        this.teaClicks = 0;
        this.gameStartTime = Date.now();
        this.unlockedScreens = ['main'];
        this.resources = this.getDefaultResources();
        this.craftables = { bicycle: 0, griddles: 0, junkDrawer: 0 };
        this.cooldowns = { mainAction: 0, gatherPrimary: 0, cook: 0, embark: 0 };
        this.triggeredEvents = [];
        this.updates = [];
        this.lastRenderedUpdateId = null;
        this.currentLocation = 'kitchen';
        this.randomEventTimer = 0;
        this.randomEventsEnabled = false;
        this.hasCellarKey = false;
        this.hasSubmachineGun = false;
        this.knowsVaultPassword = false;
        this.vaultPassword = this.generateVaultPassword();
        this.vaultUnlocked = false;
        this.vaultDirection = null;
        this.hasDefeatedTubeDude = false;
        this.hasSeenSnorfley = false;
        this.marshmallowDefeated = false;
        this.refrigeratorDirection = null;
        this.refrigeratorPlaced = false;
        this.allRatsFoundNotified = false;
        this.ratsGrantedPower = false;
        this.pendingRatsPower = false;
        this.pendingMarshmallowVictory = false;
        this.consecutiveLosses = 0;
        this.everOwnedItems = [];
        this.rats = { total: 0, paper: 0, griddles: 0 };
        this.ratTickCounter = 0;
        this.map = {
            grid: null,
            revealed: null,
            events: null,
            clearedEvents: [],
            completedThisTrip: [],
            usedSafeSpotsThisTrip: [],
            shrimpShackUsedThisTrip: false,
            playerX: 10,
            playerY: 10,
            sanity: 10,
            inMap: false,
            movesSinceEncounter: 0,
            stepsSinceSanityLoss: 0
        };
        this.addUpdate('You find yourself in a place...');
    },

    save(silent = false) {
        try {
            const saveData = {
                currentScreen: this.currentScreen,
                tickCount: this.tickCount,
                teaClicks: this.teaClicks,
                gameStartTime: this.gameStartTime,
                unlockedScreens: this.unlockedScreens,
                resources: this.resources,
                craftables: this.craftables,
                cooldowns: this.cooldowns,
                triggeredEvents: this.triggeredEvents,
                updates: this.updates.slice(0, 20),
                currentLocation: this.currentLocation,
                randomEventTimer: this.randomEventTimer,
                randomEventsEnabled: this.randomEventsEnabled,
                hasCellarKey: this.hasCellarKey,
                hasSubmachineGun: this.hasSubmachineGun,
                knowsVaultPassword: this.knowsVaultPassword,
                vaultPassword: this.vaultPassword,
                vaultUnlocked: this.vaultUnlocked,
                vaultDirection: this.vaultDirection,
                hasDefeatedTubeDude: this.hasDefeatedTubeDude,
                hasSeenSnorfley: this.hasSeenSnorfley,
                marshmallowDefeated: this.marshmallowDefeated,
                refrigeratorDirection: this.refrigeratorDirection,
                refrigeratorPlaced: this.refrigeratorPlaced,
                allRatsFoundNotified: this.allRatsFoundNotified,
                ratsGrantedPower: this.ratsGrantedPower,
                pendingRatsPower: this.pendingRatsPower,
                pendingMarshmallowVictory: this.pendingMarshmallowVictory,
                consecutiveLosses: this.consecutiveLosses,
                everOwnedItems: this.everOwnedItems,
                rats: this.rats,
                ratTickCounter: this.ratTickCounter,
                map: {
                    grid: this.map.grid,
                    revealed: this.map.revealed,
                    events: this.map.events,
                    clearedEvents: this.map.clearedEvents
                }
            };
            localStorage.setItem('darkRoomSave', JSON.stringify(saveData));
            if (!silent) {
                this.addUpdate('Game saved.');
            }
        } catch (e) {
            console.error('Failed to save:', e);
        }
    },

    addUpdate(message) {
        if (!message || message.trim() === '') return;
        const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.updates.unshift({
            message,
            timestamp: this.tickCount,
            id: id
        });
        if (this.updates.length > 50) {
            this.updates.pop();
        }
    },

    hasResource(resourceName, amount) {
        return (this.resources[resourceName] || 0) >= amount;
    },

    addResource(resourceName, amount) {
        this.resources[resourceName] = (this.resources[resourceName] || 0) + amount;

        // Track ever owned items
        if (amount > 0 && !this.everOwnedItems.includes(resourceName)) {
            this.everOwnedItems.push(resourceName);
        }
    },

    removeResource(resourceName, amount) {
        this.resources[resourceName] = Math.max(0, (this.resources[resourceName] || 0) - amount);
    },

    unlockScreen(screenName) {
        if (!this.unlockedScreens.includes(screenName)) {
            this.unlockedScreens.push(screenName);
        }
    },

    isScreenUnlocked(screenName) {
        return this.unlockedScreens.includes(screenName);
    },

    triggerEvent(eventId) {
        if (!this.triggeredEvents.includes(eventId)) {
            this.triggeredEvents.push(eventId);
        }
    },

    hasTriggeredEvent(eventId) {
        return this.triggeredEvents.includes(eventId);
    },

    canCraft(itemName) {
        const limit = this.craftLimits[itemName];
        const current = this.craftables[itemName] || 0;
        return current < limit;
    },

    resetRandomEventTimer() {
        const baseTime = 60;
        const randomTime = Math.floor(Math.random() * 121) + 60;
        this.randomEventTimer = Math.floor((baseTime + randomTime) * DEBUG.randomEventTimerMultiplier);
    },

    processRatTick() {
        this.ratTickCounter++;
        if (this.ratTickCounter >= 5) {
            this.ratTickCounter = 0;

            if (this.rats.paper > 0) {
                const paperGain = this.rats.paper * 2;
                this.addResource('paper', paperGain);
            }

            if (this.rats.griddles > 0) {
                let crumpetGain = 0;
                for (let i = 0; i < this.rats.griddles; i++) {
                    crumpetGain += Math.floor(Math.random() * 3) + 1;
                }
                this.addResource('crumpets', crumpetGain);
            }
        }
    },

    moveRatToPaper() {
        if (this.rats.griddles > 0) {
            this.rats.griddles--;
            this.rats.paper++;
        }
    },

    moveRatToGriddles() {
        if (this.rats.paper > 0) {
            this.rats.paper--;
            this.rats.griddles++;
        }
    },

    getCompassDirection(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;

        if (dy < 0 && dx === 0) return 'N';
        if (dy < 0 && dx > 0) return 'NE';
        if (dy === 0 && dx > 0) return 'E';
        if (dy > 0 && dx > 0) return 'SE';
        if (dy > 0 && dx === 0) return 'S';
        if (dy > 0 && dx < 0) return 'SW';
        if (dy === 0 && dx < 0) return 'W';
        if (dy < 0 && dx < 0) return 'NW';
        return 'nearby';
    }
};