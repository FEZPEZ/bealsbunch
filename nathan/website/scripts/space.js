(function() {
    const { Engine, Runner, World, Bodies, Body, Events, Vector } = Matter;

    const EGS_CONFIG = {
        imageWidth: 200,
        imageHeight: 120,
        initialSpeed: 1,
        initGravityStrength: 0.01,
        maxGravityStrength: 0.05,
        frictionAir: 0,
        SPEED_THRESHOLD: 25, // percentage of speed of light
        UNIT_TO_MPS: 3_000_000,
        MAX_BG_SCROLL_SPEED: 7,
        C: 299792458,
        numStars: 200,
        starMinSize: 1,
        starMaxSize: 3,
        maxStarSpeed: 50
    };

    const COON_IMAGE_DIR = "./assets/space/";

    const egsWrapper = document.getElementById("egs-wrapper");
    const egsGauge = document.getElementById("egs-gauge");
    const egsExplosion = document.getElementById("egs-explosion");

    const egsEngine = Engine.create();
    const egsWorld = egsEngine.world;
    egsWorld.gravity.y = 0;

    const egsRunner = Runner.create();
    Runner.run(egsRunner, egsEngine);

    const egsBodies = [];
    let egsRaccoonBody = null;
    let egsRaccoonContainer = null;
    let egsRaccoonFast = null;
    let egsExploded = false;

    let egsBgOffset = { x: 0, y: 0 };

    // =============================
    // AUDIO
    // =============================
    const egsAudio = new Audio(COON_IMAGE_DIR + "moon-theme.mp3");
    egsAudio.loop = true;
    let egsAudioPlaying = false;

    const egsExplosionAudio = new Audio(COON_IMAGE_DIR + "explosion-meme.mp3");

    // =============================
    // CREATE RACCOON
    // =============================
    (function createRaccoon() {
        const x = Math.random() * egsWrapper.clientWidth;
        const y = Math.random() * egsWrapper.clientHeight;
        const body = Bodies.rectangle(x, y, EGS_CONFIG.imageWidth, EGS_CONFIG.imageHeight, {
            frictionAir: EGS_CONFIG.frictionAir
        });
        Body.setVelocity(body, {
            x: (Math.random() - 0.5) * EGS_CONFIG.initialSpeed,
            y: (Math.random() - 0.5) * EGS_CONFIG.initialSpeed
        });
        World.add(egsWorld, body);
        egsBodies.push(body);

        const container = document.createElement("div");
        container.className = "egs-raccoon-container";

        const normal = document.createElement("img");
        normal.src = COON_IMAGE_DIR + "coon-normal.gif";
        normal.className = "egs-raccoon-normal";

        const fast = document.createElement("img");
        fast.src = COON_IMAGE_DIR + "coon-fast.gif";
        fast.className = "egs-raccoon-fast";

        container.appendChild(normal);
        container.appendChild(fast);
        egsWrapper.appendChild(container);

        body.domElement = container;
        egsRaccoonBody = body;
        egsRaccoonContainer = container;
        egsRaccoonFast = fast;
    })();

    // =============================
    // CREATE METEORS
    // =============================
    for (let i = 0; i < 3; i++) {
        const x = Math.random() * egsWrapper.clientWidth;
        const y = Math.random() * egsWrapper.clientHeight;
        const body = Bodies.rectangle(x, y, 80, 80, {
            frictionAir: EGS_CONFIG.frictionAir
        });
        Body.setVelocity(body, {
            x: (Math.random() - 0.5) * EGS_CONFIG.initialSpeed,
            y: (Math.random() - 0.5) * EGS_CONFIG.initialSpeed
        });
        World.add(egsWorld, body);
        egsBodies.push(body);

        const el = document.createElement("img");
        el.src = COON_IMAGE_DIR + "meteor.gif";
        el.className = "egs-object";
        el.style.width = "80px";
        el.style.height = "80px";
        egsWrapper.appendChild(el);

        body.domElement = el;
    }

    // =============================
    // CREATE STARS
    // =============================
    const egsStars = [];
    (function createStars() {
        for (let i = 0; i < EGS_CONFIG.numStars; i++) {
            const size = Math.random() * (EGS_CONFIG.starMaxSize - EGS_CONFIG.starMinSize) + EGS_CONFIG.starMinSize;
            const x = Math.random() * egsWrapper.clientWidth;
            const y = Math.random() * egsWrapper.clientHeight;

            const star = document.createElement("div");
            star.className = "egs-star";
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.background = "white";
            star.style.position = "absolute";
            star.style.left = `${x}px`;
            star.style.top = `${y}px`;
            star.style.borderRadius = "50%";
            star.style.pointerEvents = "none";
            egsWrapper.appendChild(star);

            egsStars.push({ el: star, x, y, size });
        }
    })();

    // =============================
    // SNAP WRAP AROUND EDGES + DOM SYNC
    // =============================
    Events.on(egsEngine, "afterUpdate", () => {
        if (egsExploded) {
            if (egsAudioPlaying) {
                egsAudio.pause();
                egsAudio.currentTime = 0;
                egsAudioPlaying = false;
            }
            return;
        }

        const w = egsWrapper.clientWidth;
        const h = egsWrapper.clientHeight;
        egsBodies.forEach(body => {
            const halfW = (body.domElement.offsetWidth || EGS_CONFIG.imageWidth) / 2;
            const halfH = (body.domElement.offsetHeight || EGS_CONFIG.imageHeight) / 2;
            let { x, y } = body.position;

            if (x + halfW < 0) x = w + halfW;
            if (x - halfW > w) x = -halfW;
            if (y + halfH < 0) y = h + halfH;
            if (y - halfH > h) y = -halfH;

            Body.setPosition(body, { x, y });
            body.domElement.style.transform =
                `translate(${x - halfW}px, ${y - halfH}px)`;
        });

        // check raccoon speed
        if (egsRaccoonBody) {
            const speedUnits = Vector.magnitude(egsRaccoonBody.velocity);
            if (speedUnits >= EGS_CONFIG.SPEED_THRESHOLD) {
                const speedMps = speedUnits * EGS_CONFIG.UNIT_TO_MPS;
                const fracC = speedMps / EGS_CONFIG.C;

                // start audio if not already
                if (!egsAudioPlaying) {
                    egsAudio.play().catch(() => {});
                    egsAudioPlaying = true;
                }

                if (fracC >= 0.9991) {
                    egsGauge.textContent = "Speed: ∞ c";
                    Body.setVelocity(egsRaccoonBody, { x: 0, y: 0 });
                    egsRaccoonContainer.style.display = "none";
                    egsExplosion.style.display = "block";
                    egsExploded = true;

                    // stop moon-theme if it’s playing
                    if (egsAudioPlaying) {
                        egsAudio.pause();
                        egsAudio.currentTime = 0;
                        egsAudioPlaying = false;
                    }

                    // play explosion sound once
                    egsExplosionAudio.currentTime = 0;
                    egsExplosionAudio.play().catch(() => {});
                } else {
                    const displayVal = fracC.toFixed(3);
                    egsGauge.style.display = "block";   // THIS was missing
                    egsGauge.textContent = `Speed: ${displayVal} c`;

                    egsRaccoonFast.style.opacity = fracC >= 0.5
                        ? (fracC - 0.5) / 0.5
                        : 0;
                }
            } else {
                // stop audio if playing
                if (egsAudioPlaying) {
                    egsAudio.pause();
                    egsAudio.currentTime = 0;
                    egsAudioPlaying = false;
                }
                egsGauge.style.display = "none";
                egsRaccoonFast.style.opacity = 0;
            }
        }

        // =============================
        // STAR MOTION
        // =============================
        if (egsRaccoonBody) {
            const speedUnits = Vector.magnitude(egsRaccoonBody.velocity);
            if (speedUnits >= EGS_CONFIG.SPEED_THRESHOLD) {
                const speedMps = speedUnits * EGS_CONFIG.UNIT_TO_MPS;
                const fracC = speedMps / EGS_CONFIG.C;

                const minFrac = (EGS_CONFIG.SPEED_THRESHOLD * EGS_CONFIG.UNIT_TO_MPS) / EGS_CONFIG.C;
                let t = (fracC - minFrac) / (1 - minFrac);
                t = Math.max(0, Math.min(1, t));

                const starSpeed = t * EGS_CONFIG.maxStarSpeed;

                if (speedUnits > 0) {
                    const vx = -(egsRaccoonBody.velocity.x / speedUnits) * starSpeed;
                    const vy = -(egsRaccoonBody.velocity.y / speedUnits) * starSpeed;

                    egsStars.forEach(star => {
                        star.x += vx;
                        star.y += vy;

                        // horizontal wrapping
                        if (star.x < 0) {
                            const overflow = star.x; // negative
                            star.x = w + overflow;   // wrap to right, preserving overshoot
                            star.y = Math.random() * h;
                        } else if (star.x > w) {
                            const overflow = star.x - w; // positive
                            star.x = overflow;       // wrap to left
                            star.y = Math.random() * h;
                        }

                        // vertical wrapping
                        if (star.y < 0) {
                            const overflow = star.y; // negative
                            star.y = h + overflow;   // wrap to bottom
                            star.x = Math.random() * w;
                        } else if (star.y > h) {
                            const overflow = star.y - h; // positive
                            star.y = overflow;       // wrap to top
                            star.x = Math.random() * w;
                        }

                        star.el.style.left = `${star.x}px`;
                        star.el.style.top = `${star.y}px`;
                    });
                }
            }
        }
    });

    // =============================
    // CURSOR GRAVITY
    // =============================
    let egsMousePos = null;
    let egsGravityOn = false;
    egsWrapper.addEventListener("mouseenter", () => egsGravityOn = true);
    egsWrapper.addEventListener("mouseleave", () => egsGravityOn = false);
    egsWrapper.addEventListener("mousemove", e => {
        egsMousePos = { x: e.clientX, y: e.clientY };
    });

    Events.on(egsEngine, "beforeUpdate", () => {
        if (egsExploded) return;
        if (egsGravityOn && egsMousePos && egsRaccoonBody) {
            const speedUnits = Vector.magnitude(egsRaccoonBody.velocity);
            const speedMps = speedUnits * EGS_CONFIG.UNIT_TO_MPS;
            const fracC = speedMps / EGS_CONFIG.C;

            let gravityStrength = EGS_CONFIG.initGravityStrength;
            if (fracC > 0.5) {
                const t = Math.min((fracC - 0.5) / 0.5, 1);
                gravityStrength =
                    EGS_CONFIG.initGravityStrength +
                    t * (EGS_CONFIG.maxGravityStrength - EGS_CONFIG.initGravityStrength);
            }

            const dir = Vector.sub(egsMousePos, egsRaccoonBody.position);
            const accel = Vector.mult(Vector.normalise(dir), gravityStrength);
            const newVel = {
                x: egsRaccoonBody.velocity.x + accel.x,
                y: egsRaccoonBody.velocity.y + accel.y
            };
            Body.setVelocity(egsRaccoonBody, newVel);
        }
    });

})();
