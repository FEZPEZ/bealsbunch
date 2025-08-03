// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

// Paths and assets
const SMASH_ROOT_PATH = "./assets/smash-roster/characters/";
const DEFAULT_IMG_ALT = "j";

// DOM element IDs and class names
const CONTAINER_ID = 'dream-smash-roster';
const WRAPPER_ID = 'dream-roster-wrapper';
const TOKEN_ID = 'floating-token';
const ROW_CLASS = 'roster-row';
const BOX_CLASS = 'roster-box';
const IMG_WRAPPER_CLASS = 'img-wrapper';
const IMG_CLASS = 'roster-img';
const TEXT_CLASS = 'roster-text';
const TEXT_INNER_CLASS = 'roster-text-inner';
const SELECTED_CLASS = 'selected';
const HOVERED_CLASS = 'hovered';
const POP_ANIMATION_CLASS = 'pop';

// Cursor and token configuration
const CURSOR_PATH = "./assets/smash-roster/smash.cur";
const TOKEN_WIDTH = 50;  // Should match CSS width
const TOKEN_HEIGHT = 50; // Should match CSS height
const PLACED_TOKEN_SCALE = 0.85;
const DEFAULT_TOKEN_SCALE = 1;

// Text scaling configuration
const TEXT_SCALE_MARGIN = 0.95; // Scale text to 95% of container width
const TEXT_TRANSFORM_ORIGIN = 'left center';

// Animation timing
const POP_ANIMATION_DURATION = 70; // milliseconds (matches CSS)
const TOKEN_TRANSITION_DURATION = 200; // milliseconds (matches CSS 0.2s)

// ==========================================
// CHARACTER DATA
// ==========================================

const smashGridData = [
    [
        ['zizzle iz.png', 'ZIZZLE IZ'],
        ['lucky.png', 'LUCKY'],
        ['underdog.png', 'UNDERDOG'],
        ['momo.png', 'MOMO'],
        ['3ds sound.png', '3DS SOUND'],
        ['luther.png', 'LUTHER'],
        ['buzz.png', 'BUZZ'],
        ['spudnick.png', 'SPUDNICK'],
        ['steve.png', 'STEVE'],
        ['meat or die.png', 'MEAT OR DIE'],
        ['clumsy ninja.png', 'CLUMSY NINJA'],
        ['lettuce leaf.png', 'LETTUCE LEAF'],
        ['webkinz.png', 'DOG']
    ],
    [
        ['piderman.png', 'PIDERMAN'],
        ['calvin\'s dad.png', 'CALVIN\'S DAD'],
        ['todd.png', 'TODD'],
        ['om nom.png', 'OM NOM'],
        ['tintin.png', 'TINTIN'],
        ['dragonvale.png', 'DRAGONVALE'],
        ['junkbot.png', 'JUNKBOT'],
        ['phineas and phineas.png', 'PHINEAS & PHINEAS'],
        ['zathura.png', 'ZATHURA'],
        ['mcdonalds.png', 'McDONALDS'],
        ['melman.png', 'MELMAN'],
        ['bududugu.png', 'BUDUDUGU'],
        ['yoda.png', 'YODA']
    ],
    [
        ['frog.png', 'FROG'],
        ['iron man.png', 'IRON MAN'],
        ['clyde.png', 'CLYDE'],
        ['hammy.png', 'HAMMY'],
        ['guy.png', 'GUY'],
        ['other guy.png', 'OTHER GUY'],
        ['pajama sam.png', 'PAJAMA SAM'],
        ['googles.png', 'GOOGLES'],
        ['barry.png', 'BARRY'],
        ['captain crunch.png', 'CAPTAIN CRUNCH'],
        ['future luke.png', 'FUTURE LUKE'],
        ['phineas.png', 'PHINEAS'],
        ['m.c. ballyhoo.png', 'MC BALLYHOO']
    ],
    [
        ['head monster.png', 'HEAD MONSTER'],
        ['starfright.png', 'STARFRIGHT'],
        ['carls breakfast.png', 'CARL\'S BREAKFAST'],
        ['bobby.png', 'BOBBY'],
        ['dash.png', 'DASH'],
        ['tahu.png', 'TAHU'],
        ['miss hattie.png', 'MISS HATTIE'],
        ['bigweld.png', 'BIGWELD'],
        ['knock out.png', 'KNOCK OUT'],
        ['dash pepper.png', 'DASH PEPPER'],
        ['bill nye.png', 'BILL NYE'],
        ['budderball.png', 'BUDDERBALL'],
        ['arnold.png', 'ARNOLD']
    ]
];

// ==========================================
// MAIN ROSTER CREATION
// ==========================================

const container = document.getElementById(CONTAINER_ID);

smashGridData.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = ROW_CLASS;

    row.forEach(([filename, label]) => {
        const box = document.createElement('div');
        box.className = BOX_CLASS;

        const wrapper = document.createElement('div');
        wrapper.className = IMG_WRAPPER_CLASS;

        const img = document.createElement('img');
        img.className = IMG_CLASS;
        img.src = `${SMASH_ROOT_PATH}${filename}`;
        img.alt = DEFAULT_IMG_ALT;

        const labelDiv = document.createElement('div');
        labelDiv.className = TEXT_CLASS;

        const labelInner = document.createElement('div');
        labelInner.className = TEXT_INNER_CLASS;
        labelInner.textContent = label;

        labelDiv.appendChild(labelInner);
        box.appendChild(wrapper);
        wrapper.appendChild(img);
        rowDiv.appendChild(box);
        box.appendChild(labelDiv);

        // After labelDiv is in the DOM, measure and apply scale
        requestAnimationFrame(() => {
            const containerWidth = labelDiv.clientWidth;
            applyScaleX(labelInner, containerWidth);
        });
    });

    container.appendChild(rowDiv);
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function applyScaleX(labelInner, containerWidth) {
    // Reset any existing transform
    labelInner.style.transform = `scaleX(${DEFAULT_TOKEN_SCALE})`;

    // Force layout calc
    const fullWidth = labelInner.scrollWidth;

    const scale = TEXT_SCALE_MARGIN * (containerWidth / fullWidth);

    // Only scale if necessary
    if (scale < 1) {
        labelInner.style.transform = `scaleX(${scale})`;
        labelInner.style.transformOrigin = TEXT_TRANSFORM_ORIGIN;
        labelInner.style.marginLeft = '0'; // Not needed anymore
    }
}

// ==========================================
// CURSOR AND TOKEN LOGIC
// ==========================================

let token = document.getElementById(TOKEN_ID);
let tokenActive = true; // true: following cursor
let placedToken = null;
let currentHoverBox = null;

const wrapper = document.getElementById(WRAPPER_ID);

let lastMouseX = 0;
let lastMouseY = 0;

// Track and move the floating token
wrapper.addEventListener('mousemove', e => {
    if (!tokenActive) return;

    lastMouseX = e.pageX;
    lastMouseY = e.pageY;

    updateTokenPosition();
    updateTokenHoverEffects();
});

window.addEventListener('scroll', () => {
    if (!tokenActive) return;
    updateTokenPosition();
    updateTokenHoverEffects();
});

window.addEventListener('resize', () => {
    if (!tokenActive) return;
    updateTokenPosition();
    updateTokenHoverEffects();
});

function updateTokenPosition() {
    token.style.display = 'block';
    token.style.left = (lastMouseX - token.offsetWidth / 2) + 'px';
    token.style.top = (lastMouseY - token.offsetHeight / 2) + 'px';
}

wrapper.addEventListener('mouseleave', () => {
    if (tokenActive) token.style.display = 'none';
});

document.querySelectorAll(`.${BOX_CLASS}`).forEach(box => {
    box.addEventListener('click', e => {
        if (!tokenActive) return;

        // Clear all .selected from other boxes
        document.querySelectorAll(`.${BOX_CLASS}.${SELECTED_CLASS}`).forEach(b => b.classList.remove(SELECTED_CLASS));

        // Mark the clicked box as selected
        box.classList.add(SELECTED_CLASS);

        const clickX = e.pageX;
        const clickY = e.pageY;

        if (placedToken) placedToken.remove();

        const placed = token.cloneNode(true);
        placed.removeAttribute('id');
        placed.style.display = 'block';
        placed.style.position = 'absolute';
        placed.style.left = (clickX - token.offsetWidth / 2) + 'px';
        placed.style.top = (clickY - token.offsetHeight / 2) + 'px';
        placed.style.transform = `scale(${PLACED_TOKEN_SCALE})`;
        placed.style.pointerEvents = 'auto';
        placed.style.cursor = `url('${CURSOR_PATH}'), auto`;

        document.body.appendChild(placed);
        placedToken = placed;

        token.style.display = 'none';
        tokenActive = false;

        placed.addEventListener('click', ev => {
            ev.stopPropagation();
            placed.remove();
            placedToken = null;
            tokenActive = true;
            token.style.transform = `scale(${DEFAULT_TOKEN_SCALE})`;
            token.style.display = 'block';

            // Force token to reappear at current mouse position
            const event = new MouseEvent('mousemove', {
                clientX: ev.clientX,
                clientY: ev.clientY,
                bubbles: true
            });
            wrapper.dispatchEvent(event);

            document.querySelectorAll(`.${BOX_CLASS}.${SELECTED_CLASS}`).forEach(b => b.classList.remove(SELECTED_CLASS));
        });

        box.classList.add(POP_ANIMATION_CLASS);
    });
});

function updateTokenHoverEffects() {
    if (!tokenActive) return;

    const tokenRect = token.getBoundingClientRect();
    const centerX = tokenRect.left + tokenRect.width / 2;
    const centerY = tokenRect.top + tokenRect.height / 2;

    let newHoverBox = null;

    document.querySelectorAll(`.${BOX_CLASS}`).forEach(box => {
        const rect = box.getBoundingClientRect();
        const isInside =
            centerX >= rect.left &&
            centerX <= rect.right &&
            centerY >= rect.top &&
            centerY <= rect.bottom;

        box.classList.remove(HOVERED_CLASS);

        if (isInside) {
            newHoverBox = box;
        }
    });

    if (newHoverBox) {
        newHoverBox.classList.add(HOVERED_CLASS);

        // Trigger pop every time the token ENTERS a new box
        if (newHoverBox !== currentHoverBox) {
            newHoverBox.classList.add(POP_ANIMATION_CLASS);
        }
    }

    currentHoverBox = newHoverBox;
}

document.querySelectorAll(`.${BOX_CLASS}`).forEach(box => {
    box.addEventListener('animationend', () => {
        box.classList.remove(POP_ANIMATION_CLASS);
    });
});
