import './ui/layout.css';
import { SceneManager } from './engine/sceneManager.js';
import { GameState } from './engine/gameState.js';
import { EventBus } from './engine/eventBus.js';
import { InputSystem } from './systems/input.js';
import { AudioEngine } from './audio/audioEngine.js';
import { DialogueRenderer } from './ui/dialogueRenderer.js';
import { SaveLoadSystem } from './systems/saveLoad.js';

class Game {
    constructor() {
        this.eventBus = new EventBus();
        this.gameState = new GameState();
        this.audioEngine = new AudioEngine(this.eventBus);
        this.sceneManager = new SceneManager(this.eventBus, this.gameState, this.audioEngine);
        this.dialogueRenderer = new DialogueRenderer(this.eventBus);
        this.inputSystem = new InputSystem(this.eventBus);
        this.saveLoadSystem = new SaveLoadSystem(this.gameState);

        this.audioInitialized = false;
        this.init();
    }

    async init() {
        console.log('🎮 Professor Layton RPG - Initializing...');

        // Setup UI
        this.dialogueRenderer.mount(document.getElementById('game-container'));

        // Setup event listeners
        this.setupEventListeners();

        // Wait for user interaction before initializing audio
        this.waitForUserInteraction();

        console.log('✅ Game ready! Click to start...');
    }

    waitForUserInteraction() {
        const startScreen = document.createElement('div');
        startScreen.className = 'start-screen';
        startScreen.innerHTML = `
            <div class="start-content">
                <h1>Professor Layton RPG</h1>
                <p>Click anywhere to begin</p>
            </div>
        `;
        document.body.appendChild(startScreen);

        const startGame = async () => {
            if (!this.audioInitialized) {
                await this.audioEngine.init();
                this.audioInitialized = true;
            }
            startScreen.remove();
            await this.sceneManager.loadScene('INTRO');
        };

        startScreen.addEventListener('click', startGame);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                startGame();
            }
        }, { once: true });
    }

    setupEventListeners() {
        // Expose scene manager for input system
        window.__sceneManager = this.sceneManager;

        // Listen for scene changes
        this.eventBus.on('scene:changed', (sceneId) => {
            console.log(`Scene changed to: ${sceneId}`);
        });

        // Listen for game completion
        this.eventBus.on('game:complete', () => {
            console.log('🎉 Game completed!');
            this.showEndScreen();
        });

        // Auto-save on progress
        this.eventBus.on('progress:made', () => {
            this.saveLoadSystem.autoSave();
        });

        // Handle advance input
        this.eventBus.on('input:advance', () => {
            if (this.sceneManager.dialogueEngine.isComplete()) {
                return;
            }

            if (this.sceneManager.hasNextDialogueLine()) {
                this.sceneManager.nextDialogueLine();
            }
        });
    }

    showEndScreen() {
        this.dialogueRenderer.showEndScreen();
    }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Game());
} else {
    new Game();
}