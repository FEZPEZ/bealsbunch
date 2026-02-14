export class InputSystem {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.keys = {};
        this.setupListeners();
    }

    setupListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.eventBus.emit('input:keydown', { code: e.code, key: e.key });
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.eventBus.emit('input:keyup', { code: e.code, key: e.key });
        });

        // Handle advance input
        this.eventBus.on('input:advance', () => {
            this.eventBus.emit('request:nextLine');
        });

        // Wire up nextLine request to scene manager
        this.eventBus.on('request:nextLine', () => {
            // This will be handled by scene manager
            const sceneManager = window.__sceneManager;
            if (sceneManager) {
                sceneManager.nextDialogueLine();
            }
        });
    }

    isKeyPressed(code) {
        return !!this.keys[code];
    }
}