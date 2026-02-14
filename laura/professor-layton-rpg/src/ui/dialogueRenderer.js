import { PlaceholderGraphics } from '../graphics/placeholder.js';

export class DialogueRenderer {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = null;
        this.currentLine = null;
        this.displayedText = '';
        this.fullText = '';
        this.isTyping = false;
        this.baseTypewriterSpeed = 50;
        this.typewriterTimeout = null;
        this.canAdvance = false;
        this.currentCharIndex = 0;
        this.currentMode = null;
        this.animationInterval = null;
        this.animationFrame = 0;
        this.lastSpaceTime = 0;
        this.spaceDebounce = 300; // ms
        this.bossIntroTimer = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on('dialogue:start', (line) => {
            this.showDialogue(line);
        });

        this.eventBus.on('dialogue:line', (line) => {
            this.showDialogue(line);
        });

        this.eventBus.on('scene:background', (background) => {
            this.setBackground(background);
        });

        this.eventBus.on('scene:changed', () => {
            this.clearPortraits();
        });

        this.eventBus.on('sequence:puzzle', (puzzleData) => {
            // Don't hide dialogue for puzzles
            if (puzzleData.bossIntro) {
                this.showBossIntro(puzzleData.bossIntro);
            }
        });

        this.eventBus.on('dialogue:choice', (choiceData) => {
            this.showChoices(choiceData);
        });

        this.eventBus.on('scene:transition', (transitionData) => {
            this.showTransition(transitionData);
        });

        // Allow background changes mid-scene
        this.eventBus.on('background:change', (backgroundId) => {
            this.setBackground(backgroundId);
        });
    }

    mount(containerElement) {
        this.container = containerElement;
        this.render();
        this.setupInputHandlers();
    }

    render() {
        this.container.innerHTML = `
            <div class="game-screen">
                <div class="theater-frame">
                    <div class="background-container" id="background">
                        <div class="background-scene"></div>
                    </div>
                    
                    <div class="puzzle-overlay" id="puzzle-overlay" style="display: none;">
                        <iframe id="puzzle-frame" frameborder="0"></iframe>
                    </div>
                </div>
                
                <div class="dialogue-area">
                    <div class="dialogue-container" id="dialogue-container" style="display: none;">
                        <div class="character-portrait left-portrait" id="left-portrait">
                            ${PlaceholderGraphics.character('luke', 'normal')}
                        </div>
                        
                        <div class="dialogue-box">
                            <div class="speaker-name" id="speaker-name">???</div>
                            <div class="dialogue-text" id="dialogue-text"></div>
                            <div class="continue-indicator" id="continue-indicator">▼</div>
                        </div>
                        
                        <div class="character-portrait right-portrait" id="right-portrait">
                            ${PlaceholderGraphics.character('???', 'normal')}
                        </div>
                    </div>
                </div>

                <div class="choice-container" id="choice-container" style="display: none;">
                </div>

                <div class="transition-overlay" id="transition-overlay" style="display: none;">
                    <div class="transition-text"></div>
                </div>

                <div class="boss-intro-overlay" id="boss-intro-overlay" style="display: none;">
                    <div class="boss-intro-banner">
                        <div class="boss-intro-text"></div>
                        <div class="boss-intro-effects"></div>
                    </div>
                </div>
            </div>
        `;
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();

                // Debounce space key
                const now = Date.now();
                if (now - this.lastSpaceTime < this.spaceDebounce) {
                    return;
                }
                this.lastSpaceTime = now;

                // Check if boss intro is showing (can't be skipped)
                const bossIntro = this.container.querySelector('#boss-intro-overlay');
                if (bossIntro && bossIntro.style.display !== 'none') {
                    return; // Can't skip boss intro
                }

                this.handleAdvance();
            }
        });

        // Prevent space holding
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });

        const dialogueBox = this.container.querySelector('.dialogue-box');
        dialogueBox?.addEventListener('click', () => {
            this.handleAdvance();
        });
    }

    handleAdvance() {
        if (this.isTyping) {
            this.completeTypewriter();
        } else if (this.canAdvance) {
            this.canAdvance = false; // Prevent double-firing
            this.eventBus.emit('input:advance');
        }
    }

    clearPortraits() {
        const leftPortrait = this.container.querySelector('#left-portrait');
        const rightPortrait = this.container.querySelector('#right-portrait');

        if (leftPortrait) {
            leftPortrait.style.opacity = '0';
            leftPortrait.innerHTML = '';
        }

        if (rightPortrait) {
            rightPortrait.style.opacity = '0';
            rightPortrait.innerHTML = '';
        }
    }

    showDialogue(line) {
        if (!line) return;

        // Prevent duplicate display
        if (this.currentLine === line && this.isTyping) {
            return;
        }

        this.currentLine = line;
        this.fullText = line.text;
        this.displayedText = '';
        this.isTyping = true;
        this.canAdvance = false;
        this.currentCharIndex = 0;

        const dialogueContainer = this.container.querySelector('#dialogue-container');
        dialogueContainer.style.display = 'flex';

        // Update speaker name
        const speakerName = this.container.querySelector('#speaker-name');
        const formattedName = this.formatSpeakerName(line.speaker);
        speakerName.textContent = formattedName;
        speakerName.style.display = formattedName ? 'block' : 'none';

        // Update portraits
        this.updatePortraits(line);

        // Hide continue indicator
        const indicator = this.container.querySelector('#continue-indicator');
        indicator.style.opacity = '0';

        // Clear text
        const textElement = this.container.querySelector('#dialogue-text');
        textElement.textContent = '';

        // Handle background change if specified
        if (line.background) {
            this.setBackground(line.background);
        }

        // Start typewriter
        this.startTypewriter();
    }

    updatePortraits(line) {
        const leftPortrait = this.container.querySelector('#left-portrait');
        const rightPortrait = this.container.querySelector('#right-portrait');

        const mode = line.mode || 'normal';
        this.currentMode = mode;

        if (line.speaker === 'luke') {
            leftPortrait.innerHTML = PlaceholderGraphics.character('luke', mode, false, 0);
            leftPortrait.style.opacity = '1';
            rightPortrait.style.opacity = '0.3';

            this.startTalkingAnimation('luke', mode, leftPortrait);
        } else if (line.speaker === 'narrator') {
            leftPortrait.style.opacity = '0.3';
            rightPortrait.style.opacity = '0.3';
        } else {
            leftPortrait.style.opacity = '0.3';
            rightPortrait.innerHTML = PlaceholderGraphics.character(line.speaker, mode, false, 0);
            rightPortrait.style.opacity = '1';

            this.startTalkingAnimation(line.speaker, mode, rightPortrait);
        }
    }

    startTalkingAnimation(character, mode, portraitElement) {
        this.stopTalkingAnimation();

        this.animationFrame = 0;
        this.animationInterval = setInterval(() => {
            portraitElement.innerHTML = PlaceholderGraphics.character(character, mode, true, this.animationFrame);
            this.animationFrame = (this.animationFrame + 1) % 2;
        }, 200);
    }

    stopTalkingAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    hideDialogue() {
        const dialogueContainer = this.container.querySelector('#dialogue-container');
        dialogueContainer.style.display = 'none';
        this.stopTalkingAnimation();
    }

    startTypewriter() {
        const textElement = this.container.querySelector('#dialogue-text');

        const typeChar = () => {
            if (this.currentCharIndex < this.fullText.length) {
                this.displayedText += this.fullText[this.currentCharIndex];
                textElement.textContent = this.displayedText;
                this.currentCharIndex++;

                // Use consistent speed
                this.typewriterTimeout = setTimeout(typeChar, this.baseTypewriterSpeed);
            } else {
                this.completeTypewriter();
            }
        };

        typeChar();
    }

    completeTypewriter() {
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
            this.typewriterTimeout = null;
        }

        this.isTyping = false;
        this.displayedText = this.fullText;
        this.currentCharIndex = this.fullText.length;

        const textElement = this.container.querySelector('#dialogue-text');
        textElement.textContent = this.displayedText;

        // Stop talking animation
        this.stopTalkingAnimation();
        if (this.currentLine) {
            const mode = this.currentLine.mode || 'normal';
            if (this.currentLine.speaker === 'luke') {
                const leftPortrait = this.container.querySelector('#left-portrait');
                leftPortrait.innerHTML = PlaceholderGraphics.character('luke', mode, false, 0);
            } else if (this.currentLine.speaker !== 'narrator') {
                const rightPortrait = this.container.querySelector('#right-portrait');
                rightPortrait.innerHTML = PlaceholderGraphics.character(this.currentLine.speaker, mode, false, 0);
            }
        }

        const indicator = this.container.querySelector('#continue-indicator');
        indicator.style.opacity = '1';

        this.canAdvance = true;
    }

    formatSpeakerName(speaker) {
        if (speaker === 'narrator') return '';

        const names = {
            'layton': 'Professor Layton',
            'luke': 'Luke',
            'stranger': 'Mysterious Stranger',
            'clerk': 'Store Clerk',
            'boy': 'Strange Boy',
            'man': 'Well-Dressed Man',
            'official': 'Official',
            'guest': 'Hotel Guest',
            'receptionist': 'Receptionist',
            'tubeDude': 'Tube Dude',
            'helper': 'Helpful Person'
        };
        return names[speaker] || speaker.toUpperCase();
    }

    setBackground(backgroundId) {
        const backgroundScene = this.container.querySelector('.background-scene');

        // Check if it's an HTML scene
        if (backgroundId.startsWith('scene:')) {
            // Load HTML background scene
            const sceneName = backgroundId.substring(6);
            backgroundScene.innerHTML = this.getBackgroundScene(sceneName);
        } else {
            // Use placeholder graphic
            backgroundScene.innerHTML = PlaceholderGraphics.background(backgroundId);
        }
    }

    getBackgroundScene(sceneName) {
        // Define animated background scenes
        const scenes = {
            'hotelRoom': `
                <div class="scene-hotel-room">
                    <div class="window">
                        <div class="rain"></div>
                        <div class="rain"></div>
                        <div class="rain"></div>
                    </div>
                    <div class="clock">
                        <div class="clock-hand"></div>
                    </div>
                    <div class="scene-label">[Hotel Room - Night]</div>
                </div>
            `,
            'driveway': `
                <div class="scene-driveway">
                    <div class="car"></div>
                    <div class="leaves">
                        <div class="leaf"></div>
                        <div class="leaf"></div>
                    </div>
                    <div class="scene-label">[Driveway - Morning]</div>
                </div>
            `,
            'crater': `
                <div class="scene-crater">
                    <div class="crater-hole">
                        <div class="smoke"></div>
                        <div class="smoke"></div>
                    </div>
                    <div class="debris"></div>
                    <div class="scene-label">[Massive Crater]</div>
                </div>
            `
        };

        return scenes[sceneName] || `<div class="scene-default">[${sceneName}]</div>`;
    }

    showChoices(choiceData) {
        const choiceContainer = this.container.querySelector('#choice-container');
        choiceContainer.style.display = 'flex';

        choiceContainer.innerHTML = `
            <div class="choice-prompt">${choiceData.prompt}</div>
            <div class="choice-buttons">
                ${choiceData.choices.map((choice, index) => `
                    <button class="choice-button" data-choice="${index}">
                        ${choice.text}
                    </button>
                `).join('')}
            </div>
        `;

        choiceContainer.querySelectorAll('.choice-button').forEach(button => {
            button.addEventListener('click', () => {
                const choiceIndex = parseInt(button.dataset.choice);
                this.eventBus.emit('choice:selected', choiceIndex);
                choiceContainer.style.display = 'none';
            });
        });
    }

    async showTransition(transitionData) {
        const overlay = this.container.querySelector('#transition-overlay');
        const text = overlay.querySelector('.transition-text');

        text.textContent = transitionData.text || '';
        overlay.style.display = 'flex';

        // Play transition music for chapter transitions
        if (transitionData.text && transitionData.text.includes('CHAPTER')) {
            await this.eventBus.emit('music:play', 'transition');
        }

        // Preload next scene assets during transition
        if (transitionData.nextScene) {
            this.eventBus.emit('preload:scene', transitionData.nextScene);
        }

        await new Promise(resolve => {
            setTimeout(() => {
                overlay.style.display = 'none';
                resolve();
            }, transitionData.delay || 2000);
        });
    }

    showBossIntro(bossText) {
        const overlay = this.container.querySelector('#boss-intro-overlay');
        const textElement = overlay.querySelector('.boss-intro-text');
        const effectsElement = overlay.querySelector('.boss-intro-effects');

        textElement.textContent = bossText;
        overlay.style.display = 'flex';

        // Clear any existing timer
        if (this.bossIntroTimer) {
            clearTimeout(this.bossIntroTimer);
        }

        // Add dramatic effects
        setTimeout(() => {
            overlay.classList.add('active');
            effectsElement.innerHTML = `
                <div class="lightning"></div>
                <div class="lightning"></div>
            `;
        }, 100);

        // Auto-hide after 4 seconds
        this.bossIntroTimer = setTimeout(() => {
            this.hideBossIntro();
        }, 4000);
    }

    hideBossIntro() {
        const overlay = this.container.querySelector('#boss-intro-overlay');
        overlay.classList.remove('active');

        if (this.bossIntroTimer) {
            clearTimeout(this.bossIntroTimer);
            this.bossIntroTimer = null;
        }

        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.querySelector('.boss-intro-effects').innerHTML = '';
        }, 300);
    }

    showEndScreen() {
        this.container.innerHTML = `
            <div class="end-screen">
                <h1>THE END</h1>
                <p>Thank you for playing Professor Layton RPG!</p>
                <button id="restart-button">Play Again</button>
            </div>
        `;

        this.container.querySelector('#restart-button').addEventListener('click', () => {
            location.reload();
        });
    }
}