/* Theater — per-character stats + stop-hook re-trigger for run/jump
   - Re-triggers “runs into” / “jumps over” every time the character STOPS moving
   - Andy “found you!” only on character↔Andy collision (goal: to avoid Andy)
   - Preloads assets before boot
   - EGGMAN_HEIGHT / ANDY_HEIGHT at top
   - First ATTACK blast at ground center; subsequent blasts from character every 2s
   - Building moveable, width auto by aspect, bottom-anchored
   - Wrap enabled; bomb only arms after Start; Eggman says “argh” when he moves
*/
(() => {
    const { Engine, Runner, World, Bodies, Body, Composite, Events, Vector } = Matter;


    // Secret combo (only overrides when goal is “to save the world”)
    const SECRET = {
        character: 'woody',
        action:    'flies above',
        object:    'the building',
        message:   'SECRET MISSION COMPLETE'
    };
    function isSecretCombo(){
        return norm(SEL.character.value) === SECRET.character &&
            norm(SEL.action.value)    === SECRET.action &&
            norm(SEL.object.value)    === SECRET.object;
    }

    // ===== DOM =====
    const STAGE  = document.getElementById('mvx-stage');
    const BANNER = document.getElementById('mvx-banner');

    const SEL = {
        character: document.getElementById('mvx-characterSel'),
        action:    document.getElementById('mvx-actionSel'),
        object:    document.getElementById('mvx-objectSel'),
        goal:      document.getElementById('mvx-goalSel')
    };
    const BTN = {
        action: document.getElementById('mvx-actionBtn'),
        reset:  document.getElementById('mvx-resetBtn')
    };

    // ===== Explicit NPC sizing =====
    const EGGMAN_HEIGHT = 128;
    const ANDY_HEIGHT   = 96;

    // ===== Config (global defaults) =====
    const ASSET_ROOT = './assets/write-a-play/';
    const CFG = {
        WORLD: { gravityY: 1.0, gravityScale: 0.001, boundsPad: 200 },
        FLOOR: { height: 36 },
        MAT:   { restitution: 0.35, friction: 0.05, frictionAir: 0.004 },
        SIZES: {
            buildingW: 120, buildingHFrac: 0.8,
            trenchW: 300, trenchH: 40,
            bombR: 57,
            carW: 140, carH: 70,
            rockW: 48, rockHMin: 40,
            noteR: 21,
            jellyR: 23,
            pizzaW: 54, pizzaH: 54,
            signW: 200, signH: 70
        },
        TIMING: {
            sceneMs: 4000,
            jellyRatePerSec: 3,
            attackIntervalMs: 2000
        },
        ACTION: {
            swimVX: 5.0, jumpVX: 8.0, jumpVY: -19.5, runVX: 26.0,
            flyKickVX: 3.2, flyKickVY: -11.5, fallSpin: 0.3
        },
        EXPLOSION_ATTACK: { radius: 260, minFalloff: 0.18, kick: 28 },
        EXPLOSION_BOMB:   { radius: 340, minFalloff: 0.12, kick: 320 },
        CAR: { accelPerStep: -0.35, vMax: -16.0 },
        WRAP: true
    };

    // Display heights
    const CHAR_HEIGHT = {
        Marlin: 72, Spiderman: 106, "The Iron Giant": 350, Sebastian: 122,
        Sonic: 94, Toothless: 150, Woody: 76
    };

    // ===== PER-CHARACTER STATS (edit these) =====
    const CHAR_STATS = {

        'woody':            { ACTION: {
                swimVX: 7.0, jumpVX: 3.0, jumpVY: -9.5, runVX: 6.0,
                flyKickVX: 2.2, flyKickVY: -5.5, fallSpin: 0.4
            },
            EXPLOSION_ATTACK: { radius: 100, minFalloff: 0.18, kick: 18 } },

        'sonic':            { ACTION: {
                swimVX: 1.0, jumpVX: 8.0, jumpVY: -19.5, runVX: 76.0,
                flyKickVX: 3.2, flyKickVY: -9.5, fallSpin: 0.78
            },
            EXPLOSION_ATTACK: { radius: 260, minFalloff: 0.18, kick: 28 } },

        'the iron giant':   { ACTION: {
                swimVX: 3.0, jumpVX: 2.0, jumpVY: -9.5, runVX: 5.0,
                flyKickVX: 3.2, flyKickVY: -7.5, fallSpin: 0.3
            },
            EXPLOSION_ATTACK: { radius: 460, minFalloff: 0.18, kick: 128 } },

        'spiderman':        { ACTION: {
                swimVX: 6.0, jumpVX: 10.0, jumpVY: -22.5, runVX: 26.0,
                flyKickVX: 4.2, flyKickVY: -12.5, fallSpin: 0.4
            },
            EXPLOSION_ATTACK: { radius: 260, minFalloff: 0.18, kick: 38 } },

        'marlin':           { ACTION: {
                swimVX: 15.0, jumpVX: 8.0, jumpVY: -19.5, runVX: 26.0,
                flyKickVX: 3.2, flyKickVY: -11.5, fallSpin: 0.3
            },
            EXPLOSION_ATTACK: { radius: 60, minFalloff: 0.18, kick: 11 } },

        'sebastian':        { ACTION: {
                swimVX: 2.0, jumpVX: 1.0, jumpVY: -2.5, runVX: 2.0,
                flyKickVX: 1.2, flyKickVY: -5.5, fallSpin: 0.4
            },
            EXPLOSION_ATTACK: { radius: 260, minFalloff: 0.18, kick: 28 } },

        'toothless':        { ACTION: {
                swimVX: 5.0, jumpVX: 8.0, jumpVY: -19.5, runVX: 26.0,
                flyKickVX: 3.2, flyKickVY: -11.5, fallSpin: 0.3
            },
            EXPLOSION_ATTACK: { radius: 360, minFalloff: 0.18, kick: 78 } }
    };

    // ===== Asset preload manifest =====
    const MANIFEST = {
        character: [
            'marlin','spiderman','the-iron-giant','sebastian','sonic','toothless','woody'
        ],
        object: ['the-trench','the-building','a-nuclear-bomb','a-car','perilous-rocks'],
        goal: ['pizza','eggman','andy','jellyfish','music-note']
    };

    const SO_THERE = ['so there', 'told you', 'case closed', 'boom', 'that settles it'];

    // ===== State =====
    let engine, runner, ground, ceiling, W=0, H=0, groundY=0;
    let entities = []; // { body, el, img, name, tag, w, h, aspect?, alive, bottomAnchor?, wasMoving?, start?, spoke? }
    let character = null;
    let refs = { bomb:null, building:null, car:null, pizza:null, sign:null, eggman:null, andy:null };
    let timers = [];
    let running=false, ended=false, bombArmed=false, soThereShown=false;
    let currentGoal = null;
    let charStats = null; // merged per-character stats

    const MOVE_EPS = 0.25;

    // ===== Utils =====
    const addTimer = id => (timers.push(id), id);
    const clearTimers = () => { for (const t of timers){ clearTimeout(t); clearInterval(t);} timers=[]; };
    const getSize = () => { W = STAGE.clientWidth; H = STAGE.clientHeight; groundY = H - CFG.FLOOR.height/2; };
    const norm = s => (s||'').trim().toLowerCase();
    const rand = (a,b) => Math.random()*(b-a)+a;
    const clamp = (v,a,b)=> Math.min(b, Math.max(a, v));
    const choice = arr => arr[(Math.random()*arr.length)|0];
    const nameToAsset = s => (s||'').toLowerCase().replace(/\s+/g,'-');

    // Deep merge for stats
    const BASE_STATS = { ACTION: { ...CFG.ACTION }, EXPLOSION_ATTACK: { ...CFG.EXPLOSION_ATTACK }, EXPLOSION_BOMB: { ...CFG.EXPLOSION_BOMB } };
    function deepMerge(base, over){
        const out = JSON.parse(JSON.stringify(base));
        if (!over) return out;
        (function merge(dst, src){
            for (const k in src){
                const sv = src[k];
                if (sv && typeof sv === 'object' && !Array.isArray(sv)){
                    if (!dst[k] || typeof dst[k] !== 'object') dst[k] = {};
                    merge(dst[k], sv);
                } else {
                    dst[k] = sv;
                }
            }
        })(out, over);
        return out;
    }
    function statsForCharacter(name){
        return deepMerge(BASE_STATS, CHAR_STATS[norm(name)] || null);
    }

    function makeSprite(folder, name, w, h, isSign=false, signText=''){
        const wrap = document.createElement('div');
        wrap.className = 'mvx-sprite' + (isSign ? ' mvx-sign' : '');
        wrap.style.width  = w + 'px';
        wrap.style.height = h + 'px';
        if (isSign) {
            wrap.textContent = signText || name;
            STAGE.appendChild(wrap);
            return { el: wrap, img: null };
        }
        const img = document.createElement('img');
        img.src = `${ASSET_ROOT}/${folder}/${name}.png`;
        img.alt = name;
        img.onerror = () => {
            img.remove();
            const fb = document.createElement('div');
            fb.className = 'mvx-fallback';
            fb.textContent = name;
            wrap.appendChild(fb);
        };
        wrap.appendChild(img);
        STAGE.appendChild(wrap);
        return { el: wrap, img };
    }

    function addRect({ name, tag, x, y, w, h, isStatic=false, isSensor=false, bottomAnchor=false, useSign=false, signText='' }){
        const body = Bodies.rectangle(x, y, w, h, {
            isStatic,
            isSensor,                      // <— add this
            restitution: CFG.MAT.restitution,
            friction: CFG.MAT.friction,
            frictionAir: CFG.MAT.frictionAir,
            label: `${tag}:${name}`
        });
        World.add(engine.world, body);
        const folder = tag === 'character' ? 'character' : (tag === 'goal' ? 'goal' : 'object');
        const asset  = useSign ? null : nameToAsset(name);
        const { el, img } = makeSprite(folder, asset || '', w, h, useSign, signText);
        const ent = { body, el, img, name, tag, w, h, alive:true, bottomAnchor, wasMoving:false, spoke:false };
        entities.push(ent);
        return ent;
    }

    function addCircle({ name, tag, x, y, r, isStatic=false, isSensor=false }){
        const body = Bodies.circle(x, y, r, {
            isStatic,
            isSensor,                      // <— add this
            restitution: CFG.MAT.restitution,
            friction: CFG.MAT.friction,
            frictionAir: CFG.MAT.frictionAir,
            label: `${tag}:${name}`
        });
        World.add(engine.world, body);
        const folder = tag === 'goal' ? 'goal' : 'object';
        const { el, img } = makeSprite(folder, nameToAsset(name), r*2, r*2, false);
        const ent = { body, el, img, name, tag, w:r*2, h:r*2, alive:true, wasMoving:false, spoke:false };
        entities.push(ent);
        return ent;
    }

    function removeEnt(ent){
        if (!ent?.alive) return;
        ent.alive = false;
        try { World.remove(engine.world, ent.body); } catch {}
        if (ent.el?.parentNode) ent.el.remove();
        entities = entities.filter(e => e !== ent);
    }

    function updateSprite(ent){
        const p = ent.body.position;
        const ang = ent.body.angle;
        ent.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${ang}rad)`;
    }

    function rescaleEnt(ent, newW, newH, anchorBottom=false){
        if (!ent?.alive) return;
        const sx = newW / ent.w;
        const sy = newH / ent.h;
        let bottomY = null;
        if (anchorBottom || ent.bottomAnchor) bottomY = ent.body.position.y + ent.h/2;

        Body.scale(ent.body, sx, sy);
        ent.w = newW; ent.h = newH;
        ent.el.style.width  = newW + 'px';
        ent.el.style.height = newH + 'px';

        if (bottomY !== null){
            Body.setPosition(ent.body, { x: ent.body.position.x, y: bottomY - newH/2 });
        }
    }

    function bubble(ent, text, ms=2500){
        if (!ent?.alive) return;
        const el = document.createElement('div');
        el.className = 'mvx-bubble';
        el.textContent = text;
        STAGE.appendChild(el);
        const place = () => {
            if (!ent.alive){ el.remove(); return; }
            const p = ent.body.position;
            el.style.left = p.x + 'px';
            el.style.top  = (p.y - ent.h/2 - 8) + 'px';
        };
        place();
        const id = setInterval(place, 50);
        addTimer(id);
        addTimer(setTimeout(() => { clearInterval(id); el.remove(); }, ms));
    }

    function blast(x, y, cfg, excludeIds = new Set()){
        const R = cfg.radius;
        for (const e of entities){
            if (!e.alive) continue;
            if (e.tag === 'trench') continue;
            const b = e.body;
            if (excludeIds.has(b.id)) continue;

            if (b.isStatic) Body.setStatic(b, false);

            const p = b.position;
            const d = Math.max(1, Math.hypot(p.x - x, p.y - y));
            const fall = Math.max(cfg.minFalloff, 1 - (d / R));
            const dir = Matter.Vector.normalise(Matter.Vector.sub(p, { x, y }));
            const kick = cfg.kick * fall;

            Body.setVelocity(b, { x: b.velocity.x + dir.x * kick, y: b.velocity.y + dir.y * kick });
            Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4 * fall);
        }
    }

    function fxExplosion(x, y, white=false){
        const fx = document.createElement('div');
        fx.className = white ? 'mvx-explosion mvx-explosion-white' : 'mvx-explosion';
        fx.style.left = x + 'px';
        fx.style.top  = y + 'px';
        STAGE.appendChild(fx);
        addTimer(setTimeout(() => fx.remove(), 450));
    }

    function setZeroG(on){ engine.world.gravity.y = on ? 0 : CFG.WORLD.gravityY; }

    // ===== Asset preloading =====
    function preloadAssets(manifest){
        const jobs = [];
        const load = (folder, name) => new Promise(res => {
            const img = new Image();
            img.onload  = () => res({ ok:true, folder, name });
            img.onerror = () => res({ ok:false, folder, name });
            img.src = `${ASSET_ROOT}/${folder}/${name}.png`;
        });
        for (const folder of Object.keys(manifest)){
            for (const name of manifest[folder]){
                jobs.push(load(folder, name));
            }
        }
        return Promise.all(jobs);
    }

    // ===== Build / Reset =====
    function build(){
        engine = Engine.create({ gravity:{ x:0, y:CFG.WORLD.gravityY, scale:CFG.WORLD.gravityScale } });
        runner = Runner.create();
        getSize();

        ground  = Bodies.rectangle(W/2, groundY, W+CFG.WORLD.boundsPad, CFG.FLOOR.height, { isStatic:true, label:'world:ground', friction:1 });
        ceiling = Bodies.rectangle(W/2, 0,     W+CFG.WORLD.boundsPad, CFG.FLOOR.height, { isStatic:true, label:'world:ceiling' });
        World.add(engine.world, [ground, ceiling]);

        Events.on(engine, 'beforeUpdate', () => {
            if (running && character) stepCharacter();
        });

        Events.on(engine, 'afterUpdate', () => {
            // pizza follows
            if (refs.pizza && character){
                const pz = refs.pizza.body, c = character.body.position;
                Body.setPosition(pz, { x: c.x + 32, y: c.y - character.h*0.6 });
                Body.setVelocity(pz, character.body.velocity);
                Body.setAngularVelocity(pz, 0); Body.setAngle(pz, 0);
            }

            // car moves only when running
            if (refs.car && running){
                const b = refs.car.body;
                const vx = Math.max(b.velocity.x + CFG.CAR.accelPerStep, CFG.CAR.vMax);
                Body.setVelocity(b, { x: vx, y: b.velocity.y });
            }

            // wrap dynamic bodies
            if (CFG.WRAP){
                for (const e of entities){
                    if (!e.alive || e.body.isStatic) continue;
                    const half = e.w/2;
                    if (e.body.position.x < -half)  Body.setPosition(e.body, { x: W + half, y: e.body.position.y });
                    if (e.body.position.x > W + half) Body.setPosition(e.body, { x: -half, y: e.body.position.y });
                }
            }

            // ==== STOP-HOOK: re-trigger run/jump on stop ====
            if (running && character){
                const e = character;
                const moving = Math.hypot(e.body.velocity.x, e.body.velocity.y) > MOVE_EPS;

                if (!moving && e.wasMoving){
                    const a = norm(SEL.action.value);

                    // existing behavior
                    if (a === 'runs into')  doRunInto();
                    if (a === 'jumps over') doJumpOver();

                    // NEW: when action is "flies above", also fire a (debounced) jump
                    if (a === 'flies above') stepCharacter(true);

                    if (currentGoal === 'to prove a point' && !soThereShown){
                        bubble(character, choice(SO_THERE), 2500);
                        soThereShown = true;
                    }
                }
                e.wasMoving = moving;
            }

            // Eggman “argh” the moment he moves (only in its goal)
            if (currentGoal === 'to beat Eggman' && refs.eggman){
                const e = refs.eggman;
                const moving = Math.hypot(e.body.velocity.x, e.body.velocity.y) > MOVE_EPS;
                if (moving && !e.spoke){ bubble(e, 'argh', 1800); e.spoke = true; }
            }

            // render sprites
            for (const e of entities) if (e.alive) updateSprite(e);
        });

        // Collisions: bomb (after Start), notes wake, Andy on contact only
        Events.on(engine, 'collisionStart', ev => {
            for (const pair of ev.pairs){
                const a = pair.bodyA, b = pair.bodyB;
                const ea = entities.find(x => x.body === a);
                const eb = entities.find(x => x.body === b);
                if (!ea || !eb) continue;

                if (bombArmed){
                    if (ea.tag === 'bomb') bombExplode(ea);
                    if (eb.tag === 'bomb') bombExplode(eb);
                }

                if (ea.tag === 'note' && ea.body.isStatic) Body.setStatic(ea.body, false);
                if (eb.tag === 'note' && eb.body.isStatic) Body.setStatic(eb.body, false);

                if (currentGoal === 'to avoid Andy' && refs.andy && character){
                    const hit = (ea === refs.andy && eb === character) || (eb === refs.andy && ea === character);
                    if (hit && !refs.andy.spoke){
                        bubble(refs.andy, 'found you!', 2500);
                        refs.andy.spoke = true;
                    }
                }
            }
        });

        Runner.run(runner, engine);
    }

    function reset(keepSel=true){
        running=false; ended=false; bombArmed=false; soThereShown=false; currentGoal=null;
        charStats = null;
        BANNER.textContent=''; BANNER.classList.remove('mvx-show');
        clearTimers();
        if (runner) Runner.stop(runner);
        if (engine) Composite.clear(engine.world, false);
        STAGE.innerHTML = '';
        entities=[]; character=null;
        refs = { bomb:null, building:null, car:null, pizza:null, sign:null, eggman:null, andy:null };

        build();

        if (keepSel){
            if (SEL.character.value) spawnCharacter(SEL.character.value);
            if (SEL.object.value)    spawnObject(SEL.object.value);
            if (SEL.goal.value)      setupGoal(SEL.goal.value);
        }
    }

    // ===== Spawners + aspect helpers =====
    function applyAspectAfterLoad(ent, targetH, anchorBottom){
        if (!ent?.img) return;
        const handler = () => {
            const aw = ent.img.naturalWidth  || targetH;
            const ah = ent.img.naturalHeight || targetH;
            ent.aspect = aw / Math.max(1, ah);
            const newW = Math.max(10, targetH * ent.aspect);
            rescaleEnt(ent, newW, targetH, anchorBottom);
        };
        if (ent.img.complete) handler();
        else ent.img.onload = handler;
    }

    function spawnCharacter(name){
        if (character) removeEnt(character);
        const h = CHAR_HEIGHT[name] ?? 80;

        // Merge per-character stats now
        charStats = statsForCharacter(name);

        character = addRect({
            name, tag:'character',
            x: W*0.2, y: groundY - h/2,
            w: h, h, bottomAnchor:true
        });
        applyAspectAfterLoad(character, h, true);
    }

    function spawnObject(name){
        for (const e of [...entities]){
            if (['trench','building','bomb','car','rock','note'].includes(e.tag)) removeEnt(e);
        }
        refs.bomb = null; refs.building = null; refs.car=null;

        if (name === 'the ground') return;

        const cx = W/2;

        if (name === 'the trench'){
            // FIX: center of the stage, independent of ground
            addRect({
                name:'the trench', tag:'trench',
                x: W/2,
                y: H/2,
                w: CFG.SIZES.trenchW, h: CFG.SIZES.trenchH,
                isStatic:true,
                bottomAnchor:false
            });

            return;
        }

        if (name === 'the building'){
            const initH = Math.round(H * CFG.SIZES.buildingHFrac);
            const ent = addRect({ name:'the building', tag:'building', x: cx, y: groundY - initH/2,
                w: CFG.SIZES.buildingW, h: initH, isStatic:false, bottomAnchor:true });
            refs.building = ent;
            applyAspectAfterLoad(ent, initH, true);
            return;
        }

        if (name === 'a nuclear bomb'){
            refs.bomb = addCircle({ name:'a nuclear bomb', tag:'bomb', x: cx, y: groundY - CFG.SIZES.bombR, r: CFG.SIZES.bombR });
            return;
        }

        if (name === 'a car'){
            refs.car = addRect({ name:'a car', tag:'car',
                x: W*0.6, y: groundY - CFG.SIZES.carH/2,
                w: CFG.SIZES.carW, h: CFG.SIZES.carH, isStatic:false, bottomAnchor:true });
            return;
        }

        if (name === 'perilous rocks'){
            const count = 10, hMax = H * 0.5;
            for (let i=0;i<count;i++){
                const rh = Math.round(rand(CFG.SIZES.rockHMin, hMax));
                const ent = addRect({
                    name:'perilous rocks', tag:'rock',
                    x: clamp(cx + rand(-260,260), 40, W-40), y: groundY - rh/2,
                    w: CFG.SIZES.rockW, h: rh, isStatic:false, bottomAnchor:true
                });
                ent.el.classList.add('mvx-rock');
            }
            return;
        }

        if (name === 'his music'){
            const r = CFG.SIZES.noteR;
            for (let i=0;i<18;i++){
                addCircle({
                    name:'music-note', tag:'note',
                    x: clamp(cx + rand(-180,180), r+4, W-r-4),
                    y: clamp(groundY - 140 + rand(-120,20), r+4, groundY - r - 2),
                    r, isStatic:true
                });
            }
            return;
        }
    }

    function setupGoal(name){
        currentGoal = name;

        // clear prior goal actors
        for (const k of ['pizza','sign','eggman','andy']){
            if (refs[k]){ removeEnt(refs[k]); refs[k] = null; }
        }
        // remove jellies
        for (const e of [...entities]) if (e.tag === 'jelly') removeEnt(e);

        if (name === 'to deliver pizza'){
            refs.pizza = addRect({
                name:'pizza', tag:'goal',
                x:-9999, y:-9999,
                w: CFG.SIZES.pizzaW, h: CFG.SIZES.pizzaH,
                isStatic:true,
                isSensor:true                 // <— crucial
            });
            return;
        }

        if (name === 'and opens a jazz club'){
            const who = SEL.character.value || 'Someone';
            refs.sign = addRect({ name:`${who}'s`, tag:'goal',
                x: W*0.5, y: -CFG.SIZES.signH - 40,
                w: CFG.SIZES.signW, h: CFG.SIZES.signH,
                isStatic:true, bottomAnchor:false, useSign:true, signText:`${who}'s` });
            return;
        }

        if (name === 'to beat Eggman'){
            const h = EGGMAN_HEIGHT;
            refs.eggman = addRect({ name:'Eggman', tag:'goal',
                x: W*0.8, y: groundY - h/2,
                w: h, h, isStatic:false, bottomAnchor:true });
            applyAspectAfterLoad(refs.eggman, h, true);
            return;
        }

        if (name === 'to avoid Andy'){
            const h = ANDY_HEIGHT;
            let x = W*0.65, y = groundY - h/2;
            const obj = entities.find(e => ['trench','building','bomb','car','rock'].includes(e.tag));
            if (obj){ x = obj.body.position.x; y = Math.max(0, obj.body.position.y - (obj.h/2) - 160); }
            refs.andy = addRect({ name:'Andy', tag:'goal', x, y, w:h, h, isStatic:false, bottomAnchor:false });
            applyAspectAfterLoad(refs.andy, h, false);
            return;
        }

        if (name === 'and finds a jellyfish'){ return; }
    }

    function startJellies(){
        const r = CFG.SIZES.jellyR;
        const id = setInterval(() => {
            if (!running || currentGoal !== 'and finds a jellyfish') return;
            for (let i=0;i<CFG.TIMING.jellyRatePerSec;i++){
                addCircle({
                    name:'jellyfish', tag:'jelly',
                    x: clamp(rand(40, W-40), r+4, W-r-4),
                    y: Math.random()*H*0.35,
                    r, isStatic:false
                });
            }
        }, 1000);
        addTimer(id);
    }

    // ===== Actions (use charStats.ACTION) =====
    function act(){ return (charStats && charStats.ACTION) || CFG.ACTION; }
    function exCfgAttack(){ return (charStats && charStats.EXPLOSION_ATTACK) || CFG.EXPLOSION_ATTACK; }
    function exCfgBomb(){ return (charStats && charStats.EXPLOSION_BOMB) || CFG.EXPLOSION_BOMB; }

    function doSwim(){ setZeroG(true); Body.setVelocity(character.body, { x: act().swimVX, y: 0 }); }
    function doJumpOver(){ setZeroG(false); Body.setVelocity(character.body, { x: act().jumpVX, y: act().jumpVY }); }
    function doRunInto(){ setZeroG(false); Body.setVelocity(character.body, { x: act().runVX, y: 0 }); }
    function doFlyAbove(){ setZeroG(false); Body.setVelocity(character.body, { x: act().flyKickVX*2, y: act().flyKickVY }); }
    function doFallsOnto(){ setZeroG(false); Body.setAngularVelocity(character.body, act().fallSpin); Body.setVelocity(character.body, { x: 7.0, y: 0 }); }

    // First attack at ground center; subsequent from character every 2s (white FX), using per-character explosion stats
    function doAttackStart(){
        setZeroG(false);
        Body.setVelocity(character.body, { x: 0, y: 0 });

        // FIRST blast at stage center on the ground
        const cx = W/2;
        const gy = groundY - 18;
        blast(cx, gy, exCfgAttack(), new Set([character.body.id]));
        fxExplosion(cx, gy, true);

        // Subsequent blasts from character
        const fireFromChar = () => {
            if (!running || norm(SEL.action.value) !== 'attacks' || !character?.alive) return;
            const p = character.body.position;
            const y = p.y - character.h*0.35;
            blast(p.x, y, exCfgAttack(), new Set([character.body.id]));
            fxExplosion(p.x, y, true);
        };
        const id = setInterval(fireFromChar, CFG.TIMING.attackIntervalMs);
        addTimer(id);
    }

    function stepCharacter(jumpstart = false) {
        const aSel = norm(SEL.action.value);
        const b = character.body;

        if (aSel === 'swims through'){
            if (b.velocity.x < act().swimVX){
                Body.setVelocity(b, { x: act().swimVX, y: b.velocity.y * 0.98 });
            }
        } else if (aSel === 'flies above'){
            if (b.velocity.y > 0 && b.position.y > H*0.45 || jumpstart){
                Body.setVelocity(b, { x: b.velocity.x + act().flyKickVX, y: act().flyKickVY });
            }
        } else if (aSel === 'falls onto'){
            Body.setAngularVelocity(b, act().fallSpin);
        }
    }

    function bombExplode(ent){
        if (!ent?.alive) return;
        const { x, y } = ent.body.position;
        removeEnt(ent);
        if (refs.bomb === ent) refs.bomb = null;
        blast(x, y, exCfgBomb());
        fxExplosion(x, y, false);
    }

    function updateSignLabel(){
        if (!refs.sign || currentGoal !== 'and opens a jazz club') return;
        const who = SEL.character.value || 'Someone';
        refs.sign.name = `${who}'s`;
        refs.sign.el.textContent = `${who}'s`;
    }

    function actionStart(){
        if (running) return;
        running = true; ended = false; bombArmed = true; soThereShown = false;

        // reset movement flags
        if (character) character.wasMoving = false;
        if (refs.eggman) refs.eggman.spoke = false;

        const a = norm(SEL.action.value);
        if (!character?.alive) return;

        switch (a){
            case 'swims through': doSwim(); break;
            case 'jumps over':    doJumpOver(); break;
            case 'runs into':     doRunInto(); break;
            case 'flies above':   doFlyAbove(); break;
            case 'falls onto':    doFallsOnto(); break;
            case 'attacks':       doAttackStart(); break;
        }

        if (currentGoal === 'and opens a jazz club' && refs.sign){
            updateSignLabel();
            Body.setStatic(refs.sign.body, false);
            Body.setPosition(refs.sign.body, { x: W*0.5, y: 10 });
            Body.setVelocity(refs.sign.body, { x: 0, y: 10 });
        }

        if (currentGoal === 'and finds a jellyfish') startJellies();

        addTimer(setTimeout(sceneEnd, CFG.TIMING.sceneMs));
    }

    function sceneEnd(){
        if (ended) return;
        ended = true;

        // SHOW “YOU SAVED THE WORLD” (with secret override)
        if (currentGoal === 'to save the world'){
            const text = isSecretCombo() ? SECRET.message : 'you saved the world!';
            BANNER.textContent = text;
            BANNER.classList.add('mvx-show');
        }

        // Existing behavior
        if (currentGoal === 'to prove a point' && character?.alive && !soThereShown){
            bubble(character, choice(SO_THERE), 2500);
            soThereShown = true;
        }
    }


    // Public: building height setter — width auto by image aspect, bottom anchored, dynamic body
    window.mvxSetBuildingHeight = (px) => {
        const b = refs.building;
        if (!b?.alive) return;
        const h = Math.max(10, px|0);
        const aspect = b.aspect || (b.w / Math.max(1, b.h));
        const w = Math.max(10, Math.round(h * aspect));
        rescaleEnt(b, w, h, true);
    };

    // ===== Wiring =====
    ['mvx-characterSel','mvx-actionSel','mvx-objectSel','mvx-goalSel']
        .forEach(id => document.getElementById(id).addEventListener('change', () => reset(true)));

    SEL.character.addEventListener('change', updateSignLabel);

    BTN.action.addEventListener('click', actionStart);
    BTN.reset.addEventListener('click', () => reset(true));
    window.addEventListener('resize', () => reset(true), { passive:true });

    // ===== Boot with preloading =====
    (async () => {
        await preloadAssets(MANIFEST);
        build();
        if (SEL.character.value) spawnCharacter(SEL.character.value);
        if (SEL.object.value)    spawnObject(SEL.object.value);
        if (SEL.goal.value)      setupGoal(SEL.goal.value);
    })();
})();
