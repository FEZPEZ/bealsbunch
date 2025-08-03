
// === CONFIGURATION ===
const XENOBLADE_ROOT_DIR = "./assets/xenoblade/";
const SCENE_CONFIG = {
    backgroundImage: XENOBLADE_ROOT_DIR + "mechon-ruins.png",
    minSceneHeight: 800, // px

    enemies: [
        { src: XENOBLADE_ROOT_DIR + "mechon-1.png", top: -30, left: -50, scale: 0.5 },
        { src: XENOBLADE_ROOT_DIR + "mechon-2.png", top: 90, left: -150, scale: 0.5 },
        { src: XENOBLADE_ROOT_DIR + "mechon-3.png", top: 110, left: 130, scale: 0.5 }
    ],

    shulk: { src: XENOBLADE_ROOT_DIR + "shulk.png", top: 50, right: -220, scale: 0.7 }
};

    // === DRIFTING FUNCTION ===
function applyDrift(el, baseTop, baseLeft, baseRight, scale) {
    let t = Math.random() * 1000;
    const driftMagnitude = 3 + Math.random() * 2;

    function animate() {
        t += 0.05;
        const dx = Math.sin(t * 0.9) * driftMagnitude;
        const dy = Math.cos(t * 0.7) * driftMagnitude;

        el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

        if (baseLeft !== undefined) {
            el.style.left = `${baseLeft}px`;
        }
        if (baseRight !== undefined) {
            el.style.right = `${baseRight}px`;
        }
        el.style.top = `${baseTop}px`;

        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

    // === INITIALIZE SCENE ===
    function initXenobladeScene() {
    const scene = document.getElementById("xenoblade-scene");
    if (!scene) {
    console.error("No element with id 'xenoblade-scene' found.");
    return;
}

    Object.assign(scene.style, {
    backgroundImage: `url(${SCENE_CONFIG.backgroundImage})`,
    minHeight: `${SCENE_CONFIG.minSceneHeight}px`,
});

// Add Ready to Fight banner
        const banner = document.createElement("div");
        banner.classList.add("ready-to-fight-container");

        banner.innerHTML = `
          <img class="base-banner" src="./assets/smash-roster/ready-to-fight-normal.png" />
          <img class="overlay-banner" src="./assets/smash-roster/ready-to-fight-light.png" />
          <svg class="banner-hitbox" viewBox="0 0 1384 160" preserveAspectRatio="none">
            <path d="M0,0 L0,123 L285,123 L365,160 L1020,160 L1100,123 L1384,123 L1384,0 Z"
                  class="hit-path" />
          </svg>
        `;

        scene.appendChild(banner);



        // Add enemies
    for (const enemy of SCENE_CONFIG.enemies) {
    const img = document.createElement("img");
    img.src = enemy.src;
    img.classList.add("xeno-character");
    Object.assign(img.style, {
    top: `${enemy.top}px`,
    left: `${enemy.left}px`,
});
    scene.appendChild(img);
    applyDrift(img, enemy.top, enemy.left, undefined, enemy.scale);
}

    // Add Shulk
    const shulk = document.createElement("img");
    shulk.src = SCENE_CONFIG.shulk.src;
    shulk.classList.add("xeno-character");
    Object.assign(shulk.style, {
    top: `${SCENE_CONFIG.shulk.top}px`,
    right: `${SCENE_CONFIG.shulk.right}px`,
});
    scene.appendChild(shulk);
    applyDrift(shulk, SCENE_CONFIG.shulk.top, undefined, SCENE_CONFIG.shulk.right, SCENE_CONFIG.shulk.scale);
}

    document.addEventListener("DOMContentLoaded", initXenobladeScene);
