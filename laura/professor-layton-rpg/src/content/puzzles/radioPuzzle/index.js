export default class RadioPuzzle {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.messageHandler = null;
    }

    start() {
        this.createPuzzle();
    }

    createPuzzle() {
        const puzzleOverlay = document.getElementById('puzzle-overlay');
        puzzleOverlay.style.display = 'block';

        const iframe = document.getElementById('puzzle-frame');
        iframe.src = '/src/content/puzzles/radioPuzzle/puzzle.html';

        this.messageHandler = (event) => {
            if (event.data.type === 'radio:clicked') {
                // Instantly play radio music
                this.eventBus.emit('music:play', 'radio');
            } else if (event.data.type === 'puzzle:complete') {
                this.complete(true);
            }
        };

        window.addEventListener('message', this.messageHandler);
    }

    complete(success) {
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
        }

        const puzzleOverlay = document.getElementById('puzzle-overlay');
        puzzleOverlay.style.display = 'none';

        this.eventBus.emit('puzzle:complete', {
            puzzleId: 'radio',
            success: success
        });
    }
}