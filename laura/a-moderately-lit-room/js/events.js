// js/events.js
const EventSystem = {
    checkEvents() {
        // Only trigger banana man after main hub is unlocked and 20 ticks have passed
        if (!GameState.hasTriggeredEvent('bananaMan') &&
            GameState.isScreenUnlocked('mainHub') &&
            GameState.tickCount >= 20) {
            this.triggerStoryEvent('bananaMan');
        }

        if (!GameState.hasTriggeredEvent('junkDrawerUnlock') &&
            GameState.resources.mysteryLumps >= 5 &&
            GameState.isScreenUnlocked('craftsman')) {
            GameState.triggerEvent('junkDrawerUnlock');
            this.showEventPopup({
                title: EVENT_TEMPLATES.junkDrawerUnlock.title,
                message: EVENT_TEMPLATES.junkDrawerUnlock.message,
                options: [{ text: 'continue', handler: () => {} }]
            });
        }

        // Check for rats power grant when in kitchen
        if (GameState.pendingRatsPower && GameState.currentScreen === 'mainHub') {
            GameState.pendingRatsPower = false;
            GameState.ratsGrantedPower = true;
            this.showEventPopup({
                title: 'Rat Secret',
                message: `The rats sneeze. You can now travel twice as far before losing sanity. They whisper: "Look to the ${GameState.vaultDirection}..."`,
                options: [{ text: 'thank the rats', handler: () => {} }]
            });
        }

        if (GameState.randomEventsEnabled && !GameState.map.inMap) {
            GameState.randomEventTimer--;
            if (GameState.randomEventTimer <= 0) {
                this.triggerRandomEvent();
                GameState.resetRandomEventTimer();
            }
        }
    },

    triggerStoryEvent(eventId) {
        const event = EVENT_TEMPLATES[eventId];
        if (!event) return;

        GameState.triggerEvent(eventId);

        if (event.unlocks) {
            event.unlocks.forEach(screen => {
                GameState.unlockScreen(screen);
            });
        }

        this.showEventPopup({
            title: event.title,
            message: event.message,
            options: [{ text: 'continue', handler: () => {} }]
        });
    },

    triggerRandomEvent() {
        const eligibleEvents = Object.values(RANDOM_EVENTS).filter(event => {
            if (event.condition) {
                return event.condition();
            }
            return true;
        });

        if (eligibleEvents.length === 0) return;

        // Priority events first (sneaky snorfley, shrimp sale)
        const priorityEvents = eligibleEvents.filter(e => e.priority);
        if (priorityEvents.length > 0) {
            const event = priorityEvents[0];
            this.showEventPopup(event);
            return;
        }

        const event = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
        this.showEventPopup(event);
    },

    showEventPopup(event) {
        const overlay = document.getElementById('popup-overlay');
        const titleElem = document.getElementById('popup-title');
        const messageElem = document.getElementById('popup-message');
        const extraElem = document.getElementById('popup-extra');
        const buttonsContainer = document.getElementById('popup-buttons');

        titleElem.textContent = event.title;
        messageElem.textContent = event.message;
        extraElem.innerHTML = '';

        buttonsContainer.innerHTML = '';

        event.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'popup-btn';
            btn.textContent = option.text;

            const handleClick = (e) => {
                e.preventDefault();
                overlay.classList.add('hidden');
                if (option.handler) {
                    const result = option.handler();
                    if (result) {
                        GameState.addUpdate(result);
                    }
                }
                UI.render();
            };

            btn.onmousedown = handleClick;
            btn.ontouchstart = handleClick;

            buttonsContainer.appendChild(btn);
        });

        overlay.classList.remove('hidden');
    }
};