export class SaveLoadSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.storageKey = 'laytonRPG_save';
        this.autoSaveKey = 'laytonRPG_autosave';
    }

    save(slot = 'manual') {
        try {
            const saveData = {
                state: this.gameState.serialize(),
                timestamp: Date.now(),
                slot: slot
            };

            const key = slot === 'auto' ? this.autoSaveKey : this.storageKey;
            localStorage.setItem(key, JSON.stringify(saveData));

            console.log(`💾 Game saved to slot: ${slot}`);
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    load(slot = 'manual') {
        try {
            const key = slot === 'auto' ? this.autoSaveKey : this.storageKey;
            const saveDataStr = localStorage.getItem(key);

            if (!saveDataStr) {
                console.log('No save data found');
                return false;
            }

            const saveData = JSON.parse(saveDataStr);
            this.gameState.deserialize(saveData.state);

            console.log(`📁 Game loaded from slot: ${slot}`);
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            return false;
        }
    }

    autoSave() {
        return this.save('auto');
    }

    hasSave(slot = 'manual') {
        const key = slot === 'auto' ? this.autoSaveKey : this.storageKey;
        return !!localStorage.getItem(key);
    }

    deleteSave(slot = 'manual') {
        const key = slot === 'auto' ? this.autoSaveKey : this.storageKey;
        localStorage.removeItem(key);
        console.log(`🗑️ Save deleted: ${slot}`);
    }
}