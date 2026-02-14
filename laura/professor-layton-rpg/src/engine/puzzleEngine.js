export class PuzzleEngine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentPuzzle = null;
        this.puzzleModules = {};
        this.preloadedModules = {};
    }

    async registerPuzzle(puzzleId, moduleLoader) {
        this.puzzleModules[puzzleId] = moduleLoader;
    }

    async preloadPuzzle(puzzleId) {
        if (this.preloadedModules[puzzleId] || !this.puzzleModules[puzzleId]) {
            return;
        }

        try {
            const module = await this.puzzleModules[puzzleId]();
            this.preloadedModules[puzzleId] = module;
            console.log(`Preloaded puzzle: ${puzzleId}`);
        } catch (error) {
            console.error(`Error preloading puzzle ${puzzleId}:`, error);
        }
    }

    async loadPuzzle(puzzleId) {
        console.log(`Loading puzzle: ${puzzleId}`);

        if (!this.puzzleModules[puzzleId]) {
            console.error(`Puzzle not found: ${puzzleId}`);
            return null;
        }

        try {
            // Use preloaded module if available
            const module = this.preloadedModules[puzzleId] || await this.puzzleModules[puzzleId]();
            this.currentPuzzle = new module.default(this.eventBus);
            return this.currentPuzzle;
        } catch (error) {
            console.error(`Error loading puzzle ${puzzleId}:`, error);
            return null;
        }
    }

    async startPuzzle(puzzleId) {
        const puzzle = await this.loadPuzzle(puzzleId);

        if (!puzzle) {
            this.eventBus.emit('puzzle:error', { puzzleId });
            return;
        }

        this.eventBus.emit('puzzle:start', { puzzleId });

        return new Promise((resolve) => {
            const unsubscribe = this.eventBus.on('puzzle:complete', (result) => {
                unsubscribe();
                this.currentPuzzle = null;
                resolve(result);
            });

            puzzle.start();
        });
    }

    getCurrentPuzzle() {
        return this.currentPuzzle;
    }
}