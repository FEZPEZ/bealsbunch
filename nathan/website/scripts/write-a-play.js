/* All logic wrapped & prefixed to avoid global collisions */
(() => {
    // =========================
    // SCOPED CONFIG
    // =========================

    // Root directory for all asset paths (folders like character/, object/, goal/ live under this)
    const MVX_ASSET_ROOT = './assets/write-a-play/';

    // SECRET combo (goal must be “to save the world” for the override)
    const MVX_SECRET_SEQUENCE = {
        character: 'woody',
        action:    'flies above',
        object:    'the building'
    };
    const MVX_SECRET_MESSAGE = 'SECRET MISSION COMPLETE';

    // Per-character heights (auto width)
    const MVX_CHAR_HEIGHTS = {
        Marlin: 72,
        Spiderman: 106,
        "The Iron Giant": 350,
        Sebastian: 122,
        Sonic: 94,
        Toothless: 150,
        Woody: 76
    };

    // Collision categories
    const MVX_CATS = {
        DEFAULT: 0x0001,
        GOAL:    0x0002,
        CAR:     0x0004
    };

    const MVX_CFG = {
        WORLD: { gravityY: 1.0, gravityScale: 0.001, boundsPad: 200 },
        SIZES: {
            building: { w:120, hFrac:0.8 },
            trench:   { w:300, h:40 },
            bomb:     { r:57 },
            car:      { w:140, h:70 },
            rock:     { w:48, hMin:40 },
            note:     { r:21 },
            jelly:    { r:23 },
            pizza:    { w:54, h:54 },
            sign:     { w:200, h:70 }
        },
        MATERIAL: { restitution:0.35, friction:0.05, frictionAir:0.004 },
        TIMING:   { sceneDurationMs: 4000, jellyRatePerSec: 3 },
        ACTIONS:  {
            swimSpeed: 5.0, jumpVX: 8.0, jumpVY: -19.5, runVX: 26.0,
            flyBoostVX: 3.2, flyBoostVY: -11.5, fallSpin: 0.3
        },
        EXPLOSION_ATTACK: {
            radius: 260,
            minFalloff: 0.18,
            kick: 28           // velocity kick near center for ATTACK
        },
        EXPLOSION_BOMB: {
            radius: 340,
            minFalloff: 0.12,
            kick: 320          // velocity kick near center for BOMB (stronger)
        },
        CAR:      { accelPerStep: -0.35, vMax: -16.0 }, // accel left; cap; only after ACTION
        WRAP:     { enabled: true }
    };

    // Matter aliases
    const { Engine, World, Bodies, Body, Composite, Runner, Events, Vector } = Matter;

    // DOM
    const MVX_STAGE = document.getElementById('mvx-stage');
    const MVX_ROOT  = document.getElementById('mvx-root');
    const MVX_BANNER= document.getElementById('mvx-banner');

    const MVX_SEL = {
        character: document.getElementById('mvx-characterSel'),
        action:    document.getElementById('mvx-actionSel'),
        object:    document.getElementById('mvx-objectSel'),
        goal:      document.getElementById('mvx-goalSel')
    };
    const MVX_BTN = {
        action: document.getElementById('mvx-actionBtn'),
        reset:  document.getElementById('mvx-resetBtn')
    };

    // State
    let mvxEngine, mvxRunner, mvxGround, mvxCeiling, mvxW=0, mvxH=0, mvxGroundY=0;
    let mvxEntities = []; // { body, el, name, category, tag, w, h, start, spoke, alive }
    let mvxBubbles  = []; // { el, ent, until }
    let mvxCharacter = null;
    let mvxRefs = {}; // pizza, eggman, andy, sign, car, bomb
    let mvxTimers = [];
    let mvxRunning=false, mvxEnded=false;
    let mvxCurrentGoal = null;

    // Utils
    const mvxAddTimer = (id)=>{ mvxTimers.push(id); return id; };
    const mvxClearTimers = ()=>{ for (const t of mvxTimers){ clearTimeout(t); clearInterval(t);} mvxTimers=[]; };
    const mvxGetSize = ()=>{ mvxW = MVX_STAGE.clientWidth; mvxH = MVX_STAGE.clientHeight; mvxGroundY = mvxH - 18; };
    const mvxClamp = (v,a,b)=> Math.min(b, Math.max(a, v));
    const mvxRand  = (a,b)=> Math.random()*(b-a)+a;
    const mvxDist  = (p,q)=> Math.hypot(p.x-q.x, p.y-q.y);
    const mvxName  = (s)=> (s||'item').toLowerCase().replace(/\s+/g,'-');
    const mvxNorm  = (v)=> (v||'').trim().toLowerCase();

    function mvxCreateSprite(category, name, w, h){
        const el = document.createElement('div'); el.className='mvx-sprite'; el.style.width=w+'px'; el.style.height=h+'px';
        const img = document.createElement('img');
        img.src = `${MVX_ASSET_ROOT}/${category}/${name}.png`;
        img.alt = name;
        img.onerror = () => {
            img.remove();
            const fb=document.createElement('div');
            fb.className='mvx-fallback';
            fb.textContent=name;
            el.appendChild(fb);
        };
        el.appendChild(img);
        MVX_STAGE.appendChild(el);
        return el;
    }
    function mvxCreateSign(text, w, h){
        const el = document.createElement('div'); el.className='mvx-sprite mvx-sign'; el.style.width=w+'px'; el.style.height=h+'px';
        el.textContent = text; MVX_STAGE.appendChild(el); return el;
    }

    function mvxAddRect({name, category, w, h, x, y, options={}, tag, useSign=false, collCat=MVX_CATS.DEFAULT, collMask=(MVX_CATS.DEFAULT|MVX_CATS.GOAL|MVX_CATS.CAR)}){
        const body = Bodies.rectangle(x, y, w, h, {
            restitution: MVX_CFG.MATERIAL.restitution, friction: MVX_CFG.MATERIAL.friction, frictionAir: MVX_CFG.MATERIAL.frictionAir,
            label: `${category}:${name}`, collisionFilter: { category: collCat, mask: collMask }, ...options
        });
        World.add(mvxEngine.world, body);
        const el = useSign ? mvxCreateSign(name, w, h) : mvxCreateSprite(category, mvxName(name), w, h);
        const ent = { body, el, name, category, tag, w, h, start: Vector.clone(body.position), spoke:false, alive:true };
        mvxEntities.push(ent); return ent;
    }
    function mvxAddCircle({name, category, r, x, y, options={}, tag, collCat=MVX_CATS.DEFAULT, collMask=(MVX_CATS.DEFAULT|MVX_CATS.GOAL|MVX_CATS.CAR)}){
        const body = Bodies.circle(x, y, r, {
            restitution: MVX_CFG.MATERIAL.restitution, friction: MVX_CFG.MATERIAL.friction, frictionAir: MVX_CFG.MATERIAL.frictionAir,
            label: `${category}:${name}`, collisionFilter: { category: collCat, mask: collMask }, ...options
        });
        World.add(mvxEngine.world, body);
        const el = mvxCreateSprite(category, mvxName(name), r*2, r*2);
        const ent = { body, el, name, category, tag, w:r*2, h:r*2, start: Vector.clone(body.position), spoke:false, alive:true };
        mvxEntities.push(ent); return ent;
    }
    function mvxRemove(ent){
        ent.alive=false; try { World.remove(mvxEngine.world, ent.body); } catch {}
        if (ent.el?.parentNode) ent.el.remove();
        mvxEntities = mvxEntities.filter(e => e !== ent);
        mvxBubbles = mvxBubbles.filter(b => { if (b.ent === ent){ b.el.remove(); return false; } return true; });
    }
    function mvxUpdateSprite(ent){
        const { x, y } = ent.body.position; const ang = ent.body.angle;
        ent.el.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) rotate(${ang}rad)`;
    }
    function mvxBubble(ent, text, ms=3500){
        const el = document.createElement('div'); el.className='mvx-bubble'; el.textContent = text; MVX_STAGE.appendChild(el);
        mvxBubbles.push({ el, ent, until: performance.now() + ms });
        const p = ent.body.position; el.style.left = `${p.x}px`; el.style.top = `${p.y - (ent.h/2) - 8}px`;
        mvxAddTimer(setTimeout(() => { el.remove(); mvxBubbles = mvxBubbles.filter(b => b.el !== el); }, ms));
    }
    function mvxFX(x,y){
        const fx = document.createElement('div'); fx.className='mvx-explosion'; fx.style.left = `${x}px`; fx.style.top = `${y}px`;
        MVX_STAGE.appendChild(fx); mvxAddTimer(setTimeout(()=>fx.remove(), 450));
    }
    function mvxSetZeroG(on){ mvxEngine.world.gravity.y = on ? 0 : MVX_CFG.WORLD.gravityY; }

    // Build
    function mvxBuild(){
        mvxEngine = Engine.create({ gravity: { x:0, y:MVX_CFG.WORLD.gravityY, scale:MVX_CFG.WORLD.gravityScale } });
        mvxRunner = Runner.create();
        mvxGetSize();

        mvxGround  = Bodies.rectangle(mvxW/2, mvxGroundY, mvxW+MVX_CFG.WORLD.boundsPad, 36, { isStatic:true, label:'world:ground', friction:1, restitution:0.2, collisionFilter:{category:MVX_CATS.DEFAULT, mask:(MVX_CATS.DEFAULT|MVX_CATS.GOAL|MVX_CATS.CAR)} });
        mvxCeiling = Bodies.rectangle(mvxW/2, 0,           mvxW+MVX_CFG.WORLD.boundsPad, 36, { isStatic:true, label:'world:ceiling', restitution:0.5, collisionFilter:{category:MVX_CATS.DEFAULT, mask:(MVX_CATS.DEFAULT|MVX_CATS.GOAL|MVX_CATS.CAR)} });
        World.add(mvxEngine.world, [mvxGround, mvxCeiling]);

        Events.on(mvxEngine, 'beforeUpdate', () => { if (mvxRunning && mvxCharacter) mvxStep(mvxCharacter); });

        Events.on(mvxEngine, 'afterUpdate', () => {
            // pizza follows
            if (mvxRefs.pizza && mvxCharacter){
                const p = mvxRefs.pizza.body, c = mvxCharacter.body.position;
                Body.setPosition(p, { x: c.x + 32, y: c.y - mvxCharacter.h*0.6 });
                Body.setVelocity(p, mvxCharacter.body.velocity); Body.setAngularVelocity(p, 0); Body.setAngle(p, 0);
            }

            // wrap
            if (MVX_CFG.WRAP.enabled){
                for (const e of mvxEntities){
                    const b = e.body, half = e.w/2;
                    if (b.position.x < -half)  Body.setPosition(b, { x: mvxW + half, y: b.position.y });
                    if (b.position.x > mvxW + half) Body.setPosition(b, { x: -half, y: b.position.y });
                }
            }

            // car moves only when running
            if (mvxRefs.car && mvxRunning){
                const b = mvxRefs.car.body;
                const vx = Math.max(b.velocity.x + MVX_CFG.CAR.accelPerStep, MVX_CFG.CAR.vMax);
                Body.setVelocity(b, { x: vx, y: b.velocity.y });
            }

            // Andy talks once moved (after ACTION baseline)
            if (mvxRefs.andy && mvxRunning && !mvxRefs.andy.spoke){
                const e = mvxRefs.andy; if (mvxDist(e.body.position, e.start) > 2){ e.spoke = true; mvxBubble(e, 'found you!', 2500); }
            }

            // bubble anchors
            for (const b of mvxBubbles){
                if (!b.ent?.alive) continue;
                const p = b.ent.body.position;
                b.el.style.left = `${p.x}px`;
                b.el.style.top  = `${p.y - (b.ent.h/2) - 8}px`;
            }

            // render sprites
            for (const e of mvxEntities) if (e.alive) mvxUpdateSprite(e);
        });

        // collisions
        Events.on(mvxEngine, 'collisionStart', ev => {
            for (const pair of ev.pairs){
                const a=pair.bodyA, b=pair.bodyB;
                const ea = mvxEntities.find(x => x.body === a);
                const eb = mvxEntities.find(x => x.body === b);
                if (!ea || !eb) continue;

                // notes wake on contact
                const wake = (ent) => { if (ent.tag === 'note' && ent.body.isStatic) Body.setStatic(ent.body, false); };
                wake(ea); wake(eb);

                // bomb: explode with the SAME center-field blast as "attacks"
                const tryExplode = (ent) => { if (ent?.tag === 'bomb' && ent.alive) mvxBombExplode(ent); };
                tryExplode(ea); tryExplode(eb);
            }
        });

        Runner.run(mvxRunner, mvxEngine);
    }

    function mvxReset(keepSel=true){
        mvxRunning=false; mvxEnded=false; mvxSetZeroG(false); mvxClearTimers();
        MVX_BANNER.textContent=''; MVX_BANNER.classList.remove('mvx-show');
        if (mvxRunner) Runner.stop(mvxRunner);
        if (mvxEngine) Composite.clear(mvxEngine.world, false);
        MVX_STAGE.innerHTML = '';
        for (const e of mvxEntities){ if (e.el?.parentNode) e.el.remove(); }
        mvxEntities=[]; mvxBubbles=[]; mvxCharacter=null; mvxRefs={}; mvxCurrentGoal=null;

        mvxBuild();

        if (keepSel){
            if (MVX_SEL.character.value) mvxSpawnCharacter(MVX_SEL.character.value);
            if (MVX_SEL.object.value)    mvxSpawnObject(MVX_SEL.object.value);
            if (MVX_SEL.goal.value)      mvxSetupGoal(MVX_SEL.goal.value);
        }
    }

    // Spawners
    function mvxSpawnCharacter(name){
        if (mvxCharacter) mvxRemove(mvxCharacter);
        const h = MVX_CHAR_HEIGHTS[name] ?? 80;
        const w = h;
        mvxCharacter = mvxAddRect({
            name, category:'character', w, h,
            x: mvxW*0.2, y: mvxGroundY - h/2, tag:'character',
            collCat: MVX_CATS.DEFAULT, collMask: (MVX_CATS.DEFAULT|MVX_CATS.CAR|MVX_CATS.GOAL)
        });
    }

    function mvxSpawnObject(name){
        for (const e of [...mvxEntities]){
            if (['trench','building','bomb','car','rock','note'].includes(e.tag)){
                mvxRemove(e);
                if (mvxRefs.car===e) delete mvxRefs.car;
                if (mvxRefs.bomb===e) delete mvxRefs.bomb;
            }
        }
        if (name === 'the ground') return;

        const cx = mvxW/2;

        if (name === 'the trench'){
            const s = MVX_CFG.SIZES.trench;
            mvxAddRect({
                name:'the trench', category:'object', w:s.w, h:s.h,
                x: cx, y: mvxH/2, options:{ isStatic:true }, tag:'trench',
                collCat: MVX_CATS.DEFAULT, collMask: (MVX_CATS.DEFAULT|MVX_CATS.CAR|MVX_CATS.GOAL)
            });
            return;
        }
        if (name === 'the building'){
            const h = Math.round(mvxH * MVX_CFG.SIZES.building.hFrac);
            mvxAddRect({
                name:'the building', category:'object', w:MVX_CFG.SIZES.building.w, h,
                x: cx, y: mvxGroundY - h/2, tag:'building',
                collCat: MVX_CATS.DEFAULT, collMask: (MVX_CATS.DEFAULT|MVX_CATS.CAR|MVX_CATS.GOAL)
            });
            return;
        }
        if (name === 'a nuclear bomb'){
            const r = MVX_CFG.SIZES.bomb.r;
            mvxRefs.bomb = mvxAddCircle({
                name:'a nuclear bomb', category:'object', r,
                x: cx, y: mvxGroundY - r, tag:'bomb',
                collCat: MVX_CATS.DEFAULT, collMask: (MVX_CATS.DEFAULT|MVX_CATS.CAR|MVX_CATS.GOAL)
            });
            return;
        }
        if (name === 'his music'){
            const r = MVX_CFG.SIZES.note.r;
            for (let i=0;i<18;i++){
                mvxAddCircle({
                    name:'music-note', category:'goal', r,
                    x: mvxClamp(cx + mvxRand(-180,180), r+4, mvxW-r-4),
                    y: mvxClamp(mvxGroundY - 140 + mvxRand(-120,20), r+4, mvxGroundY - r - 2),
                    options:{ isStatic:true }, tag:'note',
                    collCat: MVX_CATS.DEFAULT, collMask: (MVX_CATS.DEFAULT|MVX_CATS.CAR|MVX_CATS.GOAL)
                });
            }
            return;
        }
        if (name === 'a car'){
            const s = MVX_CFG.SIZES.car;
            mvxRefs.car = mvxAddRect({
                name:'a car', category:'object', w:s.w, h:s.h,
                x: mvxW*0.6, y: mvxGroundY - s.h/2, tag:'car',
                collCat: MVX_CATS.CAR, collMask: MVX_CATS.DEFAULT
            });
            return;
        }
        if (name === 'perilous rocks'){
            const count = 10, hMax = mvxH * 0.5;
            for (let i=0;i<count;i++){
                const h = Math.round(mvxRand(MVX_CFG.SIZES.rock.hMin, hMax));
                const ent = mvxAddRect({
                    name:'perilous rocks', category:'object', w:MVX_CFG.SIZES.rock.w, h,
                    x: mvxClamp(cx + mvxRand(-260,260), 40, mvxW-40), y: mvxGroundY - h/2, tag:'rock',
                    collCat: MVX_CATS.DEFAULT, collMask: (MVX_CATS.DEFAULT|MVX_CATS.CAR|MVX_CATS.GOAL)
                });
                ent.el.classList.add('mvx-rock');   // <- key line
            }
            return;
        }

    }

    function mvxSetupGoal(name){
        for (const k of ['pizza','sign','eggman','andy']){ if (mvxRefs[k]){ mvxRemove(mvxRefs[k]); delete mvxRefs[k]; } }
        for (const e of [...mvxEntities]) if (e.tag === 'jelly') mvxRemove(e);

        mvxCurrentGoal = name;

        if (name === 'and finds a jellyfish'){ return; }

        if (name === 'to deliver pizza'){
            const s = MVX_CFG.SIZES.pizza;
            mvxRefs.pizza = mvxAddRect({
                name:'pizza', category:'goal', w:s.w, h:s.h, x:-9999, y:-9999, options:{ isSensor:true }, tag:'pizza',
                collCat: MVX_CATS.GOAL, collMask: MVX_CATS.DEFAULT
            });
            return;
        }

        if (name === 'and opens a jazz club'){
            const s = MVX_CFG.SIZES.sign;
            const who = MVX_SEL.character.value || 'Someone';
            mvxRefs.sign = mvxAddRect({
                name:`${who}'s`, category:'goal', w:s.w, h:s.h,
                x: mvxW*0.5, y: -s.h - 40, options:{ isStatic:true }, tag:'sign',
                useSign:true, collCat: MVX_CATS.GOAL, collMask: (MVX_CATS.DEFAULT|MVX_CATS.GOAL)
            });
            return;
        }

        if (name === 'to beat Eggman'){
            const h = MVX_CHAR_HEIGHTS['Sonic'] ?? 84;
            mvxRefs.eggman = mvxAddRect({
                name:'Eggman', category:'goal', w:h, h:h,
                x: mvxW*0.8, y: mvxGroundY - h/2, tag:'eggman',
                collCat: MVX_CATS.GOAL, collMask: (MVX_CATS.DEFAULT|MVX_CATS.GOAL)
            });
            return;
        }

        if (name === 'to avoid Andy'){
            const h = MVX_CHAR_HEIGHTS['Woody'] ?? 96;
            let x = mvxW*0.65, y = mvxGroundY - h/2;
            const obj = mvxEntities.find(e => ['trench','building','bomb','car','rock'].includes(e.tag));
            if (obj){ x = obj.body.position.x; y = Math.max(0, obj.body.position.y - (obj.h/2) - 160); }
            mvxRefs.andy = mvxAddRect({
                name:'Andy', category:'goal', w:h, h:h, x, y, tag:'andy',
                collCat: MVX_CATS.GOAL, collMask: (MVX_CATS.DEFAULT|MVX_CATS.GOAL)
            });
            return;
        }
    }

    function mvxStartJellies(){
        const r = MVX_CFG.SIZES.jelly.r;
        const id = setInterval(() => {
            if (!mvxRunning) return;
            for (let i=0;i<MVX_CFG.TIMING.jellyRatePerSec;i++){
                mvxAddCircle({
                    name:'jellyfish', category:'goal', r,
                    x: mvxClamp(mvxRand(40, mvxW-40), r+4, mvxW-r-4),
                    y: mvxRand(40, mvxH*0.35), tag:'jelly',
                    collCat: MVX_CATS.GOAL, collMask: (MVX_CATS.DEFAULT|MVX_CATS.GOAL)
                });
            }
        }, 1000);
        mvxAddTimer(id);
    }

    // ACTION
    function mvxAction(){
        if (mvxRunning) return;
        mvxRunning = true; mvxEnded = false;

        // baselines
        if (mvxRefs.eggman) mvxRefs.eggman.start = Vector.clone(mvxRefs.eggman.body.position);
        if (mvxRefs.andy){ mvxRefs.andy.start = Vector.clone(mvxRefs.andy.body.position); mvxRefs.andy.spoke=false; }

        const action = MVX_SEL.action.value;
        mvxSetZeroG(action === 'swims through');

        if (mvxCharacter){
            if (action === 'swims through'){
                Body.setVelocity(mvxCharacter.body, { x: MVX_CFG.ACTIONS.swimSpeed, y: 0 });
            } else if (action === 'jumps over'){
                Body.setVelocity(mvxCharacter.body, { x: MVX_CFG.ACTIONS.jumpVX, y: MVX_CFG.ACTIONS.jumpVY });
            } else if (action === 'attacks'){
                Body.setVelocity(mvxCharacter.body, { x: 0, y: 0 });
                mvxAttackBlastAtCenter();
            } else if (action === 'runs into'){
                Body.setVelocity(mvxCharacter.body, { x: MVX_CFG.ACTIONS.runVX, y: 0 });
            } else if (action === 'flies above'){
                Body.setVelocity(mvxCharacter.body, { x: MVX_CFG.ACTIONS.flyBoostVX*2, y: MVX_CFG.ACTIONS.flyBoostVY });
            } else if (action === 'falls onto'){
                Body.setAngularVelocity(mvxCharacter.body, MVX_CFG.ACTIONS.fallSpin);
                Body.setVelocity(mvxCharacter.body, { x: 7.0, y: 0 });
            }
        }

        if (MVX_SEL.object.value === 'a nuclear bomb' && mvxRefs.bomb){
            Body.applyForce(mvxRefs.bomb.body, mvxRefs.bomb.body.position, { x: 0.002, y: -0.002 });
        }

        if (mvxCurrentGoal === 'and finds a jellyfish') mvxStartJellies();
        if (mvxCurrentGoal === 'and opens a jazz club' && mvxRefs.sign){
            mvxUpdateSignLabel();  // <- ensure latest name
            Body.setStatic(mvxRefs.sign.body, false);
            Body.setPosition(mvxRefs.sign.body, { x: mvxW*0.5, y: 10 });
            Body.setVelocity(mvxRefs.sign.body, { x: 0, y: 10 });
        }

        mvxAddTimer(setTimeout(mvxEnd, MVX_CFG.TIMING.sceneDurationMs));
    }

    function mvxComputeObjectCenterX(){
        const objs = mvxEntities.filter(e => ['trench','building','bomb','car','rock','note'].includes(e.tag));
        if (!objs.length) return mvxW/2;
        let sum=0; for (const o of objs) sum += o.body.position.x;
        return sum/objs.length;
    }

    // Same blast used by attacks and bomb
    function mvxAttackBlastAtCenter(){
        const cx = mvxComputeObjectCenterX();
        const gy = mvxGroundY - 18;
        const exclude = mvxCharacter ? new Set([mvxCharacter.body.id]) : new Set();
        mvxBlast(cx, gy, { excludeIds: exclude, cfg: MVX_CFG.EXPLOSION_ATTACK });
        mvxFX(cx, gy);
    }

    function mvxStep(ch){
        const a = MVX_SEL.action.value, b = ch.body;
        if (a === 'swims through'){
            if (b.velocity.x < MVX_CFG.ACTIONS.swimSpeed) Body.setVelocity(b, { x: MVX_CFG.ACTIONS.swimSpeed, y: b.velocity.y*0.98 });
        }
        if (a === 'flies above'){
            if (b.velocity.y > 0 && b.position.y > mvxH*0.45){
                Body.setVelocity(b, { x: b.velocity.x + MVX_CFG.ACTIONS.flyBoostVX, y: MVX_CFG.ACTIONS.flyBoostVY });
            }
        }
        if (a === 'falls onto'){ Body.setAngularVelocity(b, MVX_CFG.ACTIONS.fallSpin); }
    }

    function mvxBlast(x, y, { excludeIds = new Set(), cfg = MVX_CFG.EXPLOSION_ATTACK } = {}){
        const R = cfg.radius;
        for (const e of mvxEntities){
            if (!e.alive) continue;
            if (e.tag === 'trench') continue;
            const b = e.body;
            if (excludeIds.has(b.id)) continue;

            if (b.isStatic) Body.setStatic(b, false);

            const p = b.position;
            const d = Math.max(1, Math.hypot(p.x - x, p.y - y));
            const fall = Math.max(cfg.minFalloff, 1 - (d / R));
            const dir = Vector.normalise(Vector.sub(p, { x, y }));

            const spd = cfg.kick * fall;
            Body.setVelocity(b, {
                x: b.velocity.x + dir.x * spd,
                y: b.velocity.y + dir.y * spd
            });
            Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4 * fall);
        }
    }

    function mvxBombExplode(ent){
        mvxRemove(ent);
        if (mvxRefs.bomb === ent) delete mvxRefs.bomb;

        const cx = mvxComputeObjectCenterX();
        const gy = mvxGroundY - 18;
        mvxBlast(cx, gy, { cfg: MVX_CFG.EXPLOSION_BOMB });
        mvxFX(cx, gy);
    }

    function mvxIsSecret(){
        return mvxNorm(MVX_SEL.character.value) === MVX_SECRET_SEQUENCE.character &&
            mvxNorm(MVX_SEL.action.value)    === MVX_SECRET_SEQUENCE.action &&
            mvxNorm(MVX_SEL.object.value)    === MVX_SECRET_SEQUENCE.object;
    }

    function mvxUpdateSignLabel(){
        if (!mvxRefs.sign || mvxCurrentGoal !== 'and opens a jazz club') return;
        const who = MVX_SEL.character.value || 'Someone';
        const label = `${who}'s`;
        mvxRefs.sign.name = label;              // keep entity name in sync
        mvxRefs.sign.el.textContent = label;    // update DOM text

        // If you later switch to autosizing the physics body to text, also call:
        // requestAnimationFrame(() => mvxAutosizeSign(mvxRefs.sign));
    }

    function mvxEnd(){
        if (mvxEnded) return; mvxEnded = true;

        if (mvxCurrentGoal === 'to beat Eggman' && mvxRefs.eggman){
            const e = mvxRefs.eggman; const moved = mvxDist(e.body.position, e.start) > 2;
            mvxBubble(e, moved ? 'argh' : 'i win', 3500);
        }
        if (mvxCurrentGoal === 'to prove a point' && mvxCharacter) mvxBubble(mvxCharacter, 'so there', 3500);

        if (mvxCurrentGoal === 'to save the world'){
            const text = mvxIsSecret() ? MVX_SECRET_MESSAGE : 'you saved the world!';
            MVX_BANNER.textContent = text; MVX_BANNER.classList.add('mvx-show');
        }
    }

    // UI wiring
    ['mvx-characterSel','mvx-actionSel','mvx-objectSel','mvx-goalSel']
        .forEach(id => document.getElementById(id).addEventListener('change', () => mvxReset(true)));

    MVX_BTN.action.addEventListener('click', mvxAction);
    MVX_BTN.reset.addEventListener('click', () => mvxReset(true));
    window.addEventListener('resize', () => mvxReset(true), { passive: true });

    // Boot
    mvxBuild();
})();
