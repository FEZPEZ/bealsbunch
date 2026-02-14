export class DialogueEngine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentDialogue = null;
        this.currentLineIndex = 0;
    }

    loadDialogue(lines) {
        this.currentDialogue = lines;
        this.currentLineIndex = 0;
    }

    getCurrentLine() {
        if (!this.currentDialogue || this.currentLineIndex >= this.currentDialogue.length) {
            return null;
        }
        return this.currentDialogue[this.currentLineIndex];
    }

    nextLine() {
        if (!this.currentDialogue) return null;

        this.currentLineIndex++;

        if (this.currentLineIndex >= this.currentDialogue.length) {
            this.eventBus.emit('dialogue:complete');
            return null;
        }

        const line = this.getCurrentLine();
        this.eventBus.emit('dialogue:line', line);
        return line;
    }

    hasNextLine() {
        return this.currentDialogue && this.currentLineIndex < this.currentDialogue.length - 1;
    }

    reset() {
        this.currentDialogue = null;
        this.currentLineIndex = 0;
    }

    isComplete() {
        return !this.currentDialogue || this.currentLineIndex >= this.currentDialogue.length;
    }
}