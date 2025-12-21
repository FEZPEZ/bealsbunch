// js/battle.js
const BattleSystem = {
    active: false,
    enemy: null,
    enemyHealth: 0,
    enemyMaxHealth: 0,
    enemyPosition: 0,
    travelTime: 0,
    startTime: 0,
    enemyVe: 0,
    enemyStunned: false,
    enemyStunTime: 0,

    lumpCooldown: 0,
    shrimpCooldown: 0,
    shrimpHeld: false,
    shrimpInterval: null,
    shrimpDamage: 3,

    animationFrame: null,
    projectiles: [],
    critTexts: [],

    showIntro(enemyDef) {
        const options = [{
            text: 'fight',
            handler: () => {
                this.startBattle(enemyDef);
            }
        }];

        if (enemyDef.optional) {
            options.push({
                text: 'leave',
                handler: () => {
                    return 'you quietly back away...';
                }
            });
        }

        EventSystem.showEventPopup({
            title: 'Encounter!',
            message: enemyDef.intro,
            options: options
        });
    },

    startBattle(enemyDef) {
        this.enemy = enemyDef;
        this.enemyHealth = enemyDef.health;
        this.enemyMaxHealth = enemyDef.health;
        this.enemyPosition = 0;

        // Initialize velocities in pixels/sec
        this.enemyBaseVelocity = 25;  // base speed
        this.enemyVelocity = this.enemyBaseVelocity;
        const now = Date.now();
        this.speedHoldTime = now + 1.0 * 1000;;

        // Stun
        this.enemyStunned = false;
        this.enemyStunTime = 0;

        // Cooldowns and resources
        this.lumpCooldown = 0;
        this.shrimpCooldown = 0;
        this.shrimpHeld = false;
        this.shrimpDamage = 3;
        this.projectiles = [];
        this.critTexts = [];

        this.active = true;
        this.lastUpdateTime = Date.now(); // prevent huge dt first frame

        document.getElementById('battle-overlay').classList.add('active');
        this.renderControls();
        this.update();
    },

    endBattle(victory) {
        this.active = false;
        this.shrimpHeld = false;

        if (this.shrimpInterval) {
            clearInterval(this.shrimpInterval);
            this.shrimpInterval = null;
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        document.getElementById('battle-overlay').classList.remove('active');

        const arena = document.getElementById('battle-arena');
        arena.querySelectorAll('.projectile').forEach(p => p.remove());
        arena.querySelectorAll('.crit-text').forEach(c => c.remove());

        if (victory) {
            GameState.addUpdate('You defeated the enemy!');
            GameState.map.movesSinceEncounter = 0;
            GameState.consecutiveLosses = 0;

            // Check if marshmallow defeated
            if (this.enemy.id === 'marshmallow' && !GameState.marshmallowDefeated) {
                GameState.marshmallowDefeated = true;
                GameState.pendingMarshmallowVictory = true;

                setTimeout(() => {
                    EventSystem.showEventPopup({
                        title: 'Victory!',
                        message: 'You squished the marshmallow! I wonder what it means.',
                        options: [{ text: 'whatever', handler: () => {} }]
                    });
                }, 500);
            }

            // Check if tube dude defeated
            if (this.enemy.id === 'tubeDude') {
                GameState.hasDefeatedTubeDude = true;

                const message = 'You got the milk! Time to make some REAL tea.';
                GameState.addUpdate(message);

                setTimeout(() => {
                    EventSystem.showEventPopup({
                        title: 'Got \'em',
                        message: message,
                        options: [{ text: 'cool', handler: () => {} }]
                    });
                }, 500);

                MapSystem.completeCurrentEvent();
            }

            MapSystem.renderMap();
            MapSystem.renderSanity();
        } else {
            if (this.enemy.id !== 'tubeDude') {
                GameState.addUpdate('The creature got you! You flee the cellar.');
                GameState.consecutiveLosses++;

                // Trigger shrimp sale after 3 losses
                if (GameState.consecutiveLosses >= 3) {
                    GameState.consecutiveLosses = 0;
                    setTimeout(() => {
                        EventSystem.showEventPopup(RANDOM_EVENTS.shrimpSale);
                    }, 500);
                }

                MapSystem.bootFromMap('You were caught by a creature!');
            }
        }
    },

    update() {
        if (!this.active) return;

        const now = Date.now();
        let dt = (now - this.lastUpdateTime) / 1000; // convert ms -> seconds
        this.lastUpdateTime = now;

        const arena = document.getElementById('battle-arena');
        const arenaHeight = arena.clientHeight;

        if (this.enemy.id !== 'tubeDude') {
            // Handle stun
            if (this.enemyStunned) {
                if (now >= this.enemyStunTime) {
                    this.enemyStunned = false;
                    this.enemyVelocity = this.enemyBaseVelocity;
                    this.speedHoldTime = now + 1.0 * 1000; // hold base speed 1s
                } else {
                    this.enemyVelocity = this.enemyBaseVelocity;
                }
            } else {
                // Ramp speed after hold
                if (!this.speedHoldTime || now >= this.speedHoldTime) {
                    const accel = 40; // pixels/sec^2
                    this.enemyVelocity += accel * dt;
                } else {
                    this.enemyVelocity = this.enemyBaseVelocity;
                }
            }

            // Increment position
            this.enemyPosition += this.enemyVelocity * dt;
            this.enemyPosition = Math.min(this.enemyPosition, arenaHeight - 80);
        } else {
            this.enemyPosition = 40;
        }

        const enemyContainer = document.getElementById('enemy-container');
        enemyContainer.style.top = this.enemyPosition + 'px';

        document.getElementById('enemy-name').textContent = this.enemy.name;
        document.getElementById('enemy-health').textContent = `${this.enemyHealth}/${this.enemyMaxHealth}`;

        if (this.enemy.id !== 'tubeDude' && this.enemyPosition >= arenaHeight - 80) {
            this.endBattle(false);
            return;
        }

        this.updateProjectiles();
        this.updateCritTexts();

        this.lumpCooldown = Math.max(0, this.lumpCooldown - dt * 1000);
        this.shrimpCooldown = Math.max(0, this.shrimpCooldown - dt * 1000);

        this.renderControls();
        this.animationFrame = requestAnimationFrame(() => this.update());
    },

    updateProjectiles() {
        const arena = document.getElementById('battle-arena');
        const arenaHeight = arena.clientHeight;

        this.projectiles = this.projectiles.filter(proj => {
            proj.y -= 12;
            proj.element.style.top = proj.y + 'px';

            if (proj.y <= this.enemyPosition + 50 && proj.y >= this.enemyPosition) {
                this.hitEnemy(proj.damage, proj.canCrit);
                proj.element.remove();
                return false;
            }

            if (proj.y < 0) {
                proj.element.remove();
                return false;
            }

            return true;
        });
    },

    updateCritTexts() {
        this.critTexts = this.critTexts.filter(crit => {
            const elapsed = Date.now() - crit.startTime;
            const duration = 1000;

            if (elapsed >= duration) {
                crit.element.remove();
                return false;
            }

            const progress = elapsed / duration;
            crit.element.style.top = (crit.startY - 30 * progress) + 'px';
            crit.element.style.opacity = 1 - progress;

            return true;
        });
    },

    throwLump() {
        if (this.lumpCooldown > 0) return;
        if (!GameState.hasResource('mysteryLumps', 1)) return;

        GameState.removeResource('mysteryLumps', 1);
        this.lumpCooldown = 1000;
        this.spawnProjectile(1, true, 'lump');
    },

    throwShrimp() {
        // tube dude = 10 shrimps at a time
        if (this.enemy.id === 'tubeDude') {
            if (!GameState.hasResource('shrimps', 10)) return;
            GameState.removeResource('shrimps', 10);
            this.spawnProjectile(this.shrimpDamage * 10, false, 'shrimp');
            return;
        }
        if (!GameState.hasSubmachineGun && this.enemy.id !== 'tubeDude') {
            if (this.shrimpCooldown > 0) return;
            if (!GameState.hasResource('shrimps', 1)) return;

            GameState.removeResource('shrimps', 1);
            this.shrimpCooldown = 2000;
            this.spawnProjectile(3, false, 'shrimp');
        } else {
            if (!GameState.hasResource('shrimps', 1)) return;
            GameState.removeResource('shrimps', 1);
            this.spawnProjectile(this.shrimpDamage, false, 'shrimp');
        }
    },

    startShrimpHold() {
        if (!GameState.hasSubmachineGun && this.enemy.id !== 'tubeDude') return;
        if (this.shrimpHeld) return;

        this.shrimpHeld = true;

        // Start firing immediately
        this.throwShrimp();

        if (this.shrimpInterval) {
            clearInterval(this.shrimpInterval);
        }

        this.shrimpInterval = setInterval(() => {
            if (this.shrimpHeld && this.active) {
                this.throwShrimp();
            }
        }, 50);
    },

    stopShrimpHold() {
        this.shrimpHeld = false;
        if (this.shrimpInterval) {
            clearInterval(this.shrimpInterval);
            this.shrimpInterval = null;
        }
    },

    leaveBattle() {
        if (this.enemy.id === 'tubeDude') {
            this.active = false;
            this.stopShrimpHold();

            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }

            document.getElementById('battle-overlay').classList.remove('active');

            const arena = document.getElementById('battle-arena');
            arena.querySelectorAll('.projectile').forEach(p => p.remove());
            arena.querySelectorAll('.crit-text').forEach(c => c.remove());

            GameState.addUpdate('You backed away from the tube dude.');
            MapSystem.renderMap();
            MapSystem.renderSanity();
        }
    },

    spawnProjectile(damage, canCrit, type) {
        const arena = document.getElementById('battle-arena');
        const arenaHeight = arena.clientHeight;

        const proj = document.createElement('div');
        proj.className = 'projectile';
        proj.textContent = type === 'lump' ? 'o' : '@';
        proj.style.left = '50%';
        proj.style.transform = 'translateX(-50%)';
        proj.style.top = (arenaHeight - 40) + 'px';
        arena.appendChild(proj);

        this.projectiles.push({
            element: proj,
            y: arenaHeight - 40,
            damage: damage,
            canCrit: canCrit
        });
    },

    hitEnemy(damage, canCrit) {
        let finalDamage = damage;
        let isCrit = false;

        if (canCrit && Math.random() < 0.1) {
            finalDamage = damage * 3;
            isCrit = true;
            this.showCritText();
        }

        this.enemyHealth -= finalDamage;

        // Stun enemy and reset speed
        if (this.enemy.id !== 'tubeDude') {
            this.enemyStunned = true;
            this.enemyStunTime = Date.now() + 1000; // stunned for 1 second
            this.enemyVelocity = this.enemyBaseVelocity; // moves at base speed immediately
            this.speedHoldTime = null; // reset hold timer for speed ramp
        }

        const nameElem = document.getElementById('enemy-name');
        nameElem.classList.add('flash');
        setTimeout(() => nameElem.classList.remove('flash'), 150);

        if (this.enemyHealth <= 0) {
            this.endBattle(true);
        }
    },

    showCritText() {
        const arena = document.getElementById('battle-arena');
        const crit = document.createElement('div');
        crit.className = 'crit-text';
        crit.textContent = 'CRITICAL!';
        crit.style.left = '50%';
        crit.style.transform = 'translateX(-50%)';
        const startY = this.enemyPosition - 20;
        crit.style.top = startY + 'px';
        arena.appendChild(crit);

        this.critTexts.push({
            element: crit,
            startTime: Date.now(),
            startY: startY
        });
    },

    renderControls() {
        const container = document.getElementById('battle-controls');
        container.innerHTML = '';

        if (this.enemy.id === 'tubeDude') {
            // Tube dude battle has leave button instead of lumps
            const leaveBtn = document.createElement('button');
            leaveBtn.className = 'battle-btn';
            const leaveText = document.createElement('span');
            leaveText.className = 'button-text';
            leaveText.textContent = 'leave';
            leaveBtn.appendChild(leaveText);
            leaveBtn.onmousedown = (e) => { e.preventDefault(); this.leaveBattle(); };
            leaveBtn.ontouchstart = (e) => { e.preventDefault(); this.leaveBattle(); };
            container.appendChild(leaveBtn);
        } else {
            // Normal battles have lumps button
            const lumpBtn = document.createElement('button');
            lumpBtn.className = 'battle-btn';
            if (this.lumpCooldown > 0) {
                lumpBtn.classList.add('on-cooldown');
                const fill = document.createElement('div');
                fill.className = 'cooldown-fill';
                fill.style.width = ((1000 - this.lumpCooldown) / 1000 * 100) + '%';
                lumpBtn.appendChild(fill);
            }
            const lumpText = document.createElement('span');
            lumpText.className = 'button-text';
            lumpText.textContent = `throw lump (${GameState.resources.mysteryLumps || 0})`;
            lumpBtn.appendChild(lumpText);
            lumpBtn.onmousedown = (e) => { e.preventDefault(); this.throwLump(); };
            lumpBtn.ontouchstart = (e) => { e.preventDefault(); this.throwLump(); };
            container.appendChild(lumpBtn);
        }

        const shrimpBtn = document.createElement('button');
        shrimpBtn.className = 'battle-btn';

        if (!GameState.hasSubmachineGun && this.enemy.id !== 'tubeDude') {
            if (this.shrimpCooldown > 0) {
                shrimpBtn.classList.add('on-cooldown');
                const fill = document.createElement('div');
                fill.className = 'cooldown-fill';
                fill.style.width = ((2000 - this.shrimpCooldown) / 2000 * 100) + '%';
                shrimpBtn.appendChild(fill);
            }
        }

        const shrimpText = document.createElement('span');
        shrimpText.className = 'button-text';

        shrimpText.textContent = `throw shrimp (${GameState.resources.shrimps || 0})`;

        shrimpBtn.appendChild(shrimpText);

        if (GameState.hasSubmachineGun || this.enemy.id === 'tubeDude') {
            shrimpBtn.onmousedown = (e) => { e.preventDefault(); this.startShrimpHold(); };
            shrimpBtn.ontouchstart = (e) => { e.preventDefault(); this.startShrimpHold(); };
            shrimpBtn.onmouseup = () => this.stopShrimp();
            shrimpBtn.onmouseleave = () => this.stopShrimpHold();
            shrimpBtn.ontouchend = () => this.stopShrimpHold();
            shrimpBtn.ontouchcancel = () => this.stopShrimpHold();
        } else {
            shrimpBtn.onmousedown = (e) => { e.preventDefault(); this.throwShrimp(); };
            shrimpBtn.ontouchstart = (e) => { e.preventDefault(); this.throwShrimp(); };
        }

        container.appendChild(shrimpBtn);
    }
};