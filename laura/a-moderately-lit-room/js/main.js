// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    GameState.init();
    UI.render();
    TickSystem.start();

    // Silent autosave
    setInterval(() => {
        if (GameState.tickCount > 0 && !GameState.map.inMap) {
            GameState.save(true);
        }
    }, 30000);
});