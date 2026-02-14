export class GameState {
    constructor() {
        this.state = {
            currentChapter: null,
            currentScene: null,
            flags: {},
            variables: {},
            inventory: [],
            completedPuzzles: [],
            checkpoints: []
        };
    }

    setChapter(chapterId) {
        this.state.currentChapter = chapterId;
    }

    setScene(sceneId) {
        this.state.currentScene = sceneId;
    }

    setFlag(key, value) {
        this.state.flags[key] = value;
    }

    getFlag(key) {
        return this.state.flags[key] || false;
    }

    setVariable(key, value) {
        this.state.variables[key] = value;
    }

    getVariable(key) {
        return this.state.variables[key];
    }

    addToInventory(item) {
        this.state.inventory.push(item);
    }

    hasItem(itemId) {
        return this.state.inventory.includes(itemId);
    }

    completePuzzle(puzzleId) {
        if (!this.state.completedPuzzles.includes(puzzleId)) {
            this.state.completedPuzzles.push(puzzleId);
        }
    }

    isPuzzleCompleted(puzzleId) {
        return this.state.completedPuzzles.includes(puzzleId);
    }

    createCheckpoint() {
        this.state.checkpoints.push({
            chapter: this.state.currentChapter,
            scene: this.state.currentScene,
            timestamp: Date.now()
        });
    }

    serialize() {
        return JSON.stringify(this.state);
    }

    deserialize(data) {
        this.state = JSON.parse(data);
    }

    reset() {
        this.state = {
            currentChapter: null,
            currentScene: null,
            flags: {},
            variables: {},
            inventory: [],
            completedPuzzles: [],
            checkpoints: []
        };
    }
}