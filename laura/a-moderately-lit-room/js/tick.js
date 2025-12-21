// js/tick.js
const TickSystem = {
    intervalId: null,
    tickRate: 500,

    start() {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            this.tick();
        }, this.tickRate);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    tick() {
        GameState.tickCount++;

        for (let cooldown in GameState.cooldowns) {
            if (GameState.cooldowns[cooldown] > 0) {
                GameState.cooldowns[cooldown]--;
            }
        }

        if (GameState.rats.total > 0) {
            GameState.processRatTick();
        }

        EventSystem.checkEvents();

        UI.render();

        if (GameState.map.inMap) {
            MapSystem.renderSanity();
        }
    }
};