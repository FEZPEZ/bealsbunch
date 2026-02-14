import { DialogueEngine } from './dialogueEngine.js';
import { PuzzleEngine } from './puzzleEngine.js';

// Import all story JSON files
import introData from '../content/story/INTRO.json';
import tutorialData from '../content/story/TUTORIAL.json';
import chapter1_1Data from '../content/story/CHAPTER_1_1.json';
import chapter1_2Data from '../content/story/CHAPTER_1_2.json';
import chapter1_3Data from '../content/story/CHAPTER_1_3.json';
import chapter1_XData from '../content/story/CHAPTER_1_X.json';
import chapter2_1Data from '../content/story/CHAPTER_2_1.json';
import chapter2_2Data from '../content/story/CHAPTER_2_2.json';
import chapter2_3Data from '../content/story/CHAPTER_2_3.json';
import chapter2_XData from '../content/story/CHAPTER_2_X.json';
import chapter3_1Data from '../content/story/CHAPTER_3_1.json';
import chapter3_2Data from '../content/story/CHAPTER_3_2.json';
import chapter3_3Data from '../content/story/CHAPTER_3_3.json';
import chapter3_XData from '../content/story/CHAPTER_3_X.json';
import chapter4_1Data from '../content/story/CHAPTER_4_1.json';
import chapter4_2Data from '../content/story/CHAPTER_4_2.json';
import chapter4_3Data from '../content/story/CHAPTER_4_3.json';
import chapter4_XData from '../content/story/CHAPTER_4_X.json';

export class SceneManager {
    constructor(eventBus, gameState, audioEngine) {
        this.eventBus = eventBus;
        this.gameState = gameState;
        this.audioEngine = audioEngine;
        this.dialogueEngine = new DialogueEngine(eventBus);
        this.puzzleEngine = new PuzzleEngine(eventBus);

        this.current = null;
        this.sequenceIndex = 0;
        this.isExecuting = false;
        this.isTransitioning = false;

        this.scenes = {
            'INTRO': introData,
            'TUTORIAL': tutorialData,
            'CHAPTER_1_1': chapter1_1Data,
            'CHAPTER_1_2': chapter1_2Data,
            'CHAPTER_1_3': chapter1_3Data,
            'CHAPTER_1_X': chapter1_XData,
            'CHAPTER_2_1': chapter2_1Data,
            'CHAPTER_2_2': chapter2_2Data,
            'CHAPTER_2_3': chapter2_3Data,
            'CHAPTER_2_X': chapter2_XData,
            'CHAPTER_3_1': chapter3_1Data,
            'CHAPTER_3_2': chapter3_2Data,
            'CHAPTER_3_3': chapter3_3Data,
            'CHAPTER_3_X': chapter3_XData,
            'CHAPTER_4_1': chapter4_1Data,
            'CHAPTER_4_2': chapter4_2Data,
            'CHAPTER_4_3': chapter4_3Data,
            'CHAPTER_4_X': chapter4_XData
        };

        this.setupEventListeners();
        this.registerPuzzles();
        this.preloadPuzzles();
    }

    setupEventListeners() {
        this.eventBus.on('dialogue:complete', () => {
            if (!this.isExecuting && !this.isTransitioning) {
                this.advanceSequence();
            }
        });

        this.eventBus.on('puzzle:complete', (result) => {
            console.log('Puzzle completed:', result);
            if (result.success) {
                this.gameState.completePuzzle(result.puzzleId);
                if (!this.isExecuting && !this.isTransitioning) {
                    this.advanceSequence();
                }
            }
        });

        this.eventBus.on('music:play', async (trackId) => {
            await this.audioEngine.playMusic(trackId);
        });

        this.eventBus.on('music:stop', () => {
            this.audioEngine.stopMusic();
        });

        this.eventBus.on('preload:scene', async (sceneId) => {
            await this.preloadScene(sceneId);
        });
    }

    registerPuzzles() {
        const puzzles = [
            'radio', 'typing', 'tutorial', 'fieldTrip', 'investigation',
            'rummageSale', 'obstacle', 'heist', 'findLayton', 'ordering',
            'escape', 'mist', 'emptyStore', 'tunnel', 'tubeDude',
            'buyPhone', 'spaceFlight', 'enemyBase', 'finalBoss'
        ];

        // Register radio puzzle
        this.puzzleEngine.registerPuzzle('radio', () =>
            import('../content/puzzles/radioPuzzle/index.js'));

        // Register all others as typing puzzles
        puzzles.forEach(id => {
            if (id !== 'radio') {
                this.puzzleEngine.registerPuzzle(id, () =>
                    import('../content/puzzles/typingPuzzle/index.js'));
            }
        });
    }

    async preloadPuzzles() {
        await this.puzzleEngine.preloadPuzzle('radio');
        await this.puzzleEngine.preloadPuzzle('typing');
        await this.puzzleEngine.preloadPuzzle('tutorial');
    }

    async preloadScene(sceneId) {
        const sceneData = this.scenes[sceneId];
        if (!sceneData) return;

        // Preload music
        if (sceneData.music) {
            await this.audioEngine.preloadTrack(sceneData.music);
        }

        // Preload puzzles
        const puzzles = sceneData.sequence
            .filter(item => item.type === 'puzzle')
            .map(item => item.id);

        for (const puzzleId of puzzles) {
            await this.puzzleEngine.preloadPuzzle(puzzleId);
        }
    }

    async loadScene(sceneId) {
        console.log(`Loading scene: ${sceneId}`);

        if (this.isTransitioning) {
            console.warn('Already transitioning');
            return;
        }

        this.isTransitioning = true;
        this.isExecuting = true;

        const sceneData = this.scenes[sceneId];
        if (!sceneData) {
            console.error(`Scene not found: ${sceneId}`);
            this.isExecuting = false;
            this.isTransitioning = false;
            return;
        }

        this.currentScene = sceneData;
        this.sequenceIndex = 0;
        this.gameState.setScene(sceneId);

        if (this.currentScene.chapter) {
            this.gameState.setChapter(this.currentScene.chapter);
        }

        this.eventBus.emit('scene:changed', sceneId);
        this.eventBus.emit('progress:made');

        if (this.currentScene.background) {
            this.eventBus.emit('scene:background', this.currentScene.background);
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        // Stop any existing music first
        this.audioEngine.stopMusic();

        // Play new music after a small delay
        if (this.currentScene.music && !this.currentScene.isTransition) {
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.audioEngine.playMusic(this.currentScene.music);
        }

        this.isExecuting = false;
        this.isTransitioning = false;

        await this.executeCurrentSequence();
    }

    async executeCurrentSequence() {
        if (this.isExecuting || this.isTransitioning) return;

        if (!this.currentScene || this.sequenceIndex >= this.currentScene.sequence.length) {
            this.onSceneComplete();
            return;
        }

        this.isExecuting = true;
        const item = this.currentScene.sequence[this.sequenceIndex];

        try {
            switch (item.type) {
                case 'dialogue':
                    await this.executeDialogue(item);
                    break;
                case 'puzzle':
                    await this.executePuzzle(item);
                    break;
                case 'transition':
                    await this.executeTransition(item);
                    break;
                case 'flag':
                    this.executeFlag(item);
                    break;
                case 'choice':
                    await this.executeChoice(item);
                    break;
                case 'background':
                    this.executeBackgroundChange(item);
                    break;
                default:
                    console.warn(`Unknown sequence type: ${item.type}`);
                    this.advanceSequence();
            }
        } catch (error) {
            console.error('Error executing sequence:', error);
            this.isExecuting = false;
        }
    }

    async executeDialogue(item) {
        this.dialogueEngine.loadDialogue(item.lines);
        const firstLine = this.dialogueEngine.getCurrentLine();

        // Prevent double display
        if (firstLine) {
            this.eventBus.emit('dialogue:start', firstLine);
        }

        this.isExecuting = false;
    }

    async executePuzzle(item) {
        const puzzleData = { ...item };

        const bossIntros = {
            'obstacle': 'CRATER GUARDIAN',
            'escape': 'HOTEL RECEPTIONIST',
            'tubeDude': 'TUBE DUDE',
            'finalBoss': 'MYSTERIOUS STRANGER'
        };

        if (bossIntros[item.id]) {
            puzzleData.bossIntro = bossIntros[item.id];
        }

        this.eventBus.emit('sequence:puzzle', puzzleData);
        this.isExecuting = false;
        await this.puzzleEngine.startPuzzle(item.id);
    }

    async executeTransition(item) {
        this.isTransitioning = true;
        await this.eventBus.emit('scene:transition', item);

        await new Promise(resolve => setTimeout(resolve, item.delay || 1000));

        if (item.nextScene) {
            this.isExecuting = false;
            this.isTransitioning = false;
            await this.loadScene(item.nextScene);
        } else {
            this.isExecuting = false;
            this.isTransitioning = false;
            this.advanceSequence();
        }
    }

    executeFlag(item) {
        this.gameState.setFlag(item.key, item.value);
        this.isExecuting = false;
        this.advanceSequence();
    }

    async executeChoice(item) {
        this.eventBus.emit('dialogue:choice', item);

        this.eventBus.once('choice:selected', async (choiceIndex) => {
            const choice = item.choices[choiceIndex];
            if (choice.flag) {
                this.gameState.setFlag(choice.flag.key, choice.flag.value);
            }
            if (choice.nextScene) {
                this.isExecuting = false;
                await this.loadScene(choice.nextScene);
            } else {
                this.isExecuting = false;
                this.advanceSequence();
            }
        });

        this.isExecuting = false;
    }

    executeBackgroundChange(item) {
        this.eventBus.emit('background:change', item.backgroundId);
        this.isExecuting = false;
        this.advanceSequence();
    }

    advanceSequence() {
        if (this.isExecuting || this.isTransitioning) return;

        this.sequenceIndex++;
        this.executeCurrentSequence();
    }

    async onSceneComplete() {
        console.log('Scene complete');

        if (this.currentScene.nextScene) {
            await this.loadScene(this.currentScene.nextScene);
        } else {
            this.eventBus.emit('game:complete');
        }
    }

    nextDialogueLine() {
        return this.dialogueEngine.nextLine();
    }

    hasNextDialogueLine() {
        return this.dialogueEngine.hasNextLine();
    }
}