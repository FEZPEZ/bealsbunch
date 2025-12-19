// ==================== THEME CONFIGURATION ====================
const GAME_THEMES = {
    BOGELHAUS: {
        name: "BOGELHAUS",
        primary: "#ffffff",
        secondary: "#464167",
        background: "#d6c2af",
        surface: "#f5f0e8",
        highlight: "#d94527",
        accent: "#f5a845",
        success: "#24a482",
        muted: "#756c8c",
        warning: "#d94527",
        diceTop: "#f5f0e8",
        diceSide: "#d94527",
        diceFront: "#f5f0e8",
        diceText: "#464167",
        diceHighlight: "#f5a845",
        dieColors: ["#d94527"]
    },
    MONDRIAN: {
        name: "MONDRIAN",
        primary: "#ffffff",
        secondary: "#000000",
        background: "#f5f5f0",
        surface: "#ffffff",
        highlight: "#dd0100",
        accent: "#fac901",
        success: "#225095",
        muted: "#666666",
        warning: "#dd0100",
        diceTop: "#ffffff",
        diceSide: "#000000",
        diceFront: "#ffffff",
        diceText: "#000000",
        diceHighlight: "#fac901",
        dieColors: ["#dd0100", "#fac901", "#225095", "#ffffff"]
    },
    SUNSET: {
        name: "SUNSET",
        primary: "#ffffff",
        secondary: "#2d1b4e",
        background: "#ffb347",
        surface: "#fff5e6",
        highlight: "#ff6b6b",
        accent: "#ffd93d",
        success: "#f44a2a",
        muted: "#95709b",
        warning: "#ff6b6b",
        diceTop: "#fff5e6",
        diceSide: "#ff6b6b",
        diceFront: "#fff5e6",
        diceText: "#2d1b4e",
        diceHighlight: "#ffd93d",
        dieColors: ["#ff6b6b", "#ff8e53", "#ffd93d"]
    },
    OCEAN: {
        name: "OCEAN",
        primary: "#ffffff",
        secondary: "#1a3a4a",
        background: "#87ceeb",
        surface: "#e6f3f8",
        highlight: "#006994",
        accent: "#40e0d0",
        success: "#1b9c94",
        muted: "#5f9ea0",
        warning: "#ff6347",
        diceTop: "#e6f3f8",
        diceSide: "#006994",
        diceFront: "#e6f3f8",
        diceText: "#1a3a4a",
        diceHighlight: "#40e0d0",
        dieColors: ["#006994", "#40e0d0", "#20b2aa"]
    },
    BUBBLEGUM: {
        name: "BUBBLEGUM",
        primary: "#ffffff",
        secondary: "#4a4a6a",
        background: "#ffc1e3",
        surface: "#fff5fa",
        highlight: "#ff69b4",
        accent: "#87ceeb",
        success: "#52cbf3",
        muted: "#b19cd9",
        warning: "#ff69b4",
        diceTop: "#fff5fa",
        diceSide: "#ff69b4",
        diceFront: "#fff5fa",
        diceText: "#4a4a6a",
        diceHighlight: "#87ceeb",
        dieColors: ["#ff69b4", "#87ceeb", "#ffc1e3"]
    },
    DARK: {
        name: "GALAXY",
        primary: "#000000",
        secondary: "#cfcfcf",
        background: "#1a1a1a",
        surface: "#2d2d2d",
        highlight: "#cfcfcf",
        accent: "#888888",
        success: "#a3a3a3",
        muted: "#666666",
        warning: "#ff4444",
        diceTop: "#2d2d2d",
        diceSide: "#e8e8e8",
        diceFront: "#2d2d2d",
        diceText: "#e8e8e8",
        diceHighlight: "#555555",
        dieColors: ["#e8e8e8"],
        // Special flag for inverted word items
        invertedWordItems: true
    }
};

// Current theme key
let currentThemeKey = 'BOGELHAUS';

// Die configurations (standard Boggle dice)
const DICE = [
    ['R', 'I', 'F', 'O', 'B', 'X'],
    ['I', 'F', 'E', 'H', 'E', 'Y'],
    ['D', 'E', 'N', 'O', 'W', 'S'],
    ['U', 'T', 'O', 'K', 'N', 'D'],
    ['H', 'M', 'S', 'R', 'A', 'O'],
    ['L', 'U', 'P', 'E', 'T', 'S'],
    ['A', 'C', 'I', 'T', 'O', 'A'],
    ['Y', 'L', 'G', 'K', 'U', 'E'],
    ['Qu', 'B', 'M', 'J', 'O', 'A'],
    ['E', 'H', 'I', 'S', 'P', 'N'],
    ['V', 'E', 'T', 'I', 'G', 'N'],
    ['B', 'A', 'L', 'I', 'Y', 'T'],
    ['E', 'Z', 'A', 'V', 'N', 'D'],
    ['R', 'A', 'L', 'E', 'S', 'C'],
    ['U', 'W', 'I', 'L', 'R', 'G'],
    ['P', 'A', 'C', 'E', 'M', 'D']
];

// Game state
let board = Array(16).fill(null);
let dictionary = null;
let isAnimating = false;
let foundWordsData = [];
let currentSortMode = 'alpha'; // 'alpha' or 'length'
let selectedWord = null;
let wordsExpanded = false;

let lastGeneratedBoard = null;       // 16 letters array
let bestFoundBoard = null;           // 16 letters array
let bestBoardPoints = 0;


// User interaction state
let userFoundWords = new Map();
let currentPath = [];
let currentWord = '';
let isUserMode = false;
let idleTimeout = null;
let totalPossibleWords = 0;
let totalPossiblePoints = 0;
let hasSolved = false;

// Drag state
let isDragMode = false;
let pressStart = null;
let preventNextClick = false;
const DRAG_THRESHOLD = 10;
const DRAG_HITBOX_EDGE_SHRINK_PERCENT = 0.08;

// Drag path state (only validate on release)
let dragPath = [];
let dragWord = '';

// Timer mode state
let isTimedMode = false;
let timerSeconds = 120; // Default 2:00
let timerSettingSeconds = 120;
let timerInterval = null;

// Settings state
let helpfulMode = false;
let allPossibleWords = new Map(); // For helpful mode

// Track grayed out positions (by position, not letter)
let grayedOutPositions = new Set();

// DOM Elements
const boardEl = document.getElementById('board');
const generateBtn = document.getElementById('generateBtn');
const solveBtn = document.getElementById('solveBtn');
const popupOverlay = document.getElementById('popupOverlay');
const enterPopupOverlay = document.getElementById('enterPopupOverlay');
const randomBtn = document.getElementById('randomBtn');
const timedBtn = document.getElementById('timedBtn');
const optimizeBtn = document.getElementById('optimizeBtn');
const enterBtn = document.getElementById('enterBtn');
const cancelBtn = document.getElementById('cancelBtn');
const enterCancelBtn = document.getElementById('enterCancelBtn');
const letterInput = document.getElementById('letterInput');
const currentDieNum = document.getElementById('currentDieNum');
const enterPreview = document.getElementById('enterPreview');
const wordsList = document.getElementById('wordsList');
const wordCount = document.getElementById('wordCount');
const totalPoints = document.getElementById('totalPoints');
const wordsContainer = document.getElementById('wordsContainer');
const wordsHeader = document.getElementById('wordsHeader');
const sortBtn = document.getElementById('sortBtn');
const pathOverlay = document.getElementById('pathOverlay');
const boardContainer = document.querySelector('.board-container');
const gameTitle = document.getElementById('gameTitle');
const timerDisplay = document.getElementById('timerDisplay');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPopupOverlay = document.getElementById('settingsPopupOverlay');
const helpfulModeBtn = document.getElementById('helpfulModeBtn');
const timerSettingBtn = document.getElementById('timerSettingBtn');
const themeBtn = document.getElementById('themeBtn');
const settingsCancelBtn = document.getElementById('settingsCancelBtn');
const timesUpPopupOverlay = document.getElementById('timesUpPopupOverlay');
const timesUpStats = document.getElementById('timesUpStats');
const timesUpOkBtn = document.getElementById('timesUpOkBtn');

// Create solve confirmation popup
const solvePopupOverlay = document.createElement('div');
solvePopupOverlay.className = 'popup-overlay';
solvePopupOverlay.id = 'solvePopupOverlay';
solvePopupOverlay.innerHTML = `
    <div class="popup">
        <h2>SHOW ALL WORDS?</h2>
        <button class="btn btn-solve-confirm" id="solveConfirmBtn">
            <span class="btn-face">REVEAL</span>
            <span class="btn-shadow"></span>
        </button>
        <button class="btn btn-cancel" id="solveCancelBtn">
            <span class="btn-face">CANCEL</span>
            <span class="btn-shadow"></span>
        </button>
    </div>
`;

// Create congratulations popup
const congratsPopupOverlay = document.createElement('div');
congratsPopupOverlay.className = 'popup-overlay';
congratsPopupOverlay.id = 'congratsPopupOverlay';
congratsPopupOverlay.innerHTML = `
    <div class="popup">
        <h2>CONGRATULATIONS!</h2>
        <p class="congrats-message">YOU FOUND ALL THE WORDS!</p>
        <button class="btn btn-ok" id="congratsOkBtn">
            <span class="btn-face">OK</span>
            <span class="btn-shadow"></span>
        </button>
    </div>
`;

// Apply theme to CSS variables
function applyTheme(themeKey) {
    const theme = GAME_THEMES[themeKey];
    if (!theme) return;

    currentThemeKey = themeKey;
    const root = document.documentElement;

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-highlight', theme.highlight);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-success', theme.success);
    root.style.setProperty('--color-muted', theme.muted);
    root.style.setProperty('--color-warning', theme.warning);
    root.style.setProperty('--color-dice-top', theme.diceTop);
    root.style.setProperty('--color-dice-side', theme.diceSide);
    root.style.setProperty('--color-dice-front', theme.diceFront);
    root.style.setProperty('--color-dice-text', theme.diceText);
    root.style.setProperty('--color-dice-highlight', theme.diceHighlight);

    // Set dark theme flag
    if (theme.invertedWordItems) {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.removeAttribute('data-theme');
    }

    // Update arrowhead fill
    const arrowhead = document.getElementById('arrowhead');
    if (arrowhead) {
        arrowhead.querySelector('polygon').setAttribute('fill', theme.highlight);
    }

    // Apply die colors if board exists
    applyDieColors();

    // Update theme button text
    if (themeBtn) {
        themeBtn.querySelector('.btn-face').textContent = `THEME: ${theme.name}`;
    }
}

// Apply boustrophedon die colors
function applyDieColors() {
    const theme = GAME_THEMES[currentThemeKey];
    if (!theme || !theme.dieColors || theme.dieColors.length === 0) return;

    const colors = theme.dieColors;

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const index = row * 4 + col;
            // Boustrophedon: reverse direction on odd rows
            const effectiveCol = row % 2 === 0 ? col : (3 - col);
            const colorIndex = (row * 4 + effectiveCol) % colors.length;

            const face = document.getElementById(`face-${index}`);
            if (face) {
                face.style.setProperty('--current-die-color', colors[colorIndex]);
            }
        }
    }
}

// Get Bauhaus colors for floating word animation
function getBauhausColors() {
    const theme = GAME_THEMES[currentThemeKey];
    return [
        theme.highlight,
        theme.accent,
        theme.success,
        theme.muted,
        theme.secondary
    ];
}

// Reset timer display to show title
function resetTimerDisplay() {
    stopTimer();
    isTimedMode = false;
    timerDisplay.classList.add('hidden');
    gameTitle.classList.remove('hidden');
}

// Initialize the app
async function init() {
    document.body.appendChild(solvePopupOverlay);
    document.body.appendChild(congratsPopupOverlay);
    applyTheme('BOGELHAUS');
    createBoard();
    await loadDictionary();
    setupEventListeners();
    updateSolveButton();
    updateSettingsDisplay();

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Create the 4x4 board of dice
function createBoard() {
    boardEl.innerHTML = '';

    for (let i = 0; i < 16; i++) {
        const dieContainer = document.createElement('div');
        dieContainer.className = 'die-container';

        const die = document.createElement('div');
        die.className = 'die';
        die.id = `die-${i}`;

        const face = document.createElement('div');
        face.className = 'die-face';
        face.id = `face-${i}`;

        const faceInner = document.createElement('div');
        faceInner.className = 'die-face-inner';

        face.appendChild(faceInner);
        die.appendChild(face);

        face.addEventListener('mousedown', (e) => handlePointerDown(e, i));
        face.addEventListener('touchstart', (e) => handlePointerDown(e, i), { passive: false });

        face.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDieClick(i);
        });

        dieContainer.appendChild(die);
        boardEl.appendChild(dieContainer);
    }

    updateDieSize();
    applyDieColors();
}

// Get die index from screen coordinates
function getDieIndexFromPoint(x, y, useSmallerHitbox = false) {
    for (let i = 0; i < 16; i++) {
        const face = document.getElementById(`face-${i}`);
        if (!face) continue;

        const rect = face.getBoundingClientRect();

        let left = rect.left;
        let right = rect.right;
        let top = rect.top;
        let bottom = rect.bottom;

        if (useSmallerHitbox) {
            const shrinkX = rect.width * DRAG_HITBOX_EDGE_SHRINK_PERCENT;
            const shrinkY = rect.height * DRAG_HITBOX_EDGE_SHRINK_PERCENT;
            left += shrinkX;
            right -= shrinkX;
            top += shrinkY;
            bottom -= shrinkY;
        }

        if (x >= left && x <= right && y >= top && y <= bottom) {
            return i;
        }
    }
    return -1;
}

// Handle pointer down (mousedown or touchstart)
function handlePointerDown(e, index) {
    // Clear any word highlight on interaction
    clearWordHighlight();

    if (board[index] === null || isAnimating || hasSolved) return;

    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;
    pressStart = {
        index: index,
        x: point.clientX,
        y: point.clientY
    };
    isDragMode = false;
    dragPath = [];
    dragWord = '';
}

// Handle pointer move (mousemove or touchmove)
function handlePointerMove(e) {
    if (!pressStart) return;

    const point = e.touches ? e.touches[0] : e;

    if (!isDragMode) {
        const dx = point.clientX - pressStart.x;
        const dy = point.clientY - pressStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > DRAG_THRESHOLD) {
            isDragMode = true;
            preventNextClick = true;
            clearIdleTimeout();
            clearCurrentPath();
            activateDieForDrag(pressStart.index);
        }
    }

    if (isDragMode) {
        e.preventDefault();
        handleDragOver(point.clientX, point.clientY);
    }
}

// Handle dragging over dice
function handleDragOver(x, y) {
    const dieIndex = getDieIndexFromPoint(x, y, true);

    if (dieIndex === -1) return;
    if (board[dieIndex] === null) return;

    const row = Math.floor(dieIndex / 4);
    const col = dieIndex % 4;

    // Check for backtracking
    if (dragPath.length >= 2) {
        const prevPos = dragPath[dragPath.length - 2];
        if (prevPos.row === row && prevPos.col === col) {
            undoLastDragDieSelection();
            return;
        }
    }

    const existingIndex = dragPath.findIndex(pos => pos.row === row && pos.col === col);
    if (existingIndex !== -1) return;

    if (dragPath.length > 0) {
        const lastPos = dragPath[dragPath.length - 1];
        const rowDiff = Math.abs(row - lastPos.row);
        const colDiff = Math.abs(col - lastPos.col);

        if (rowDiff > 1 || colDiff > 1) {
            clearDragPath();
            return;
        }
    }

    activateDieForDrag(dieIndex);
}

// Activate a die in drag mode
function activateDieForDrag(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;

    if (dragPath.some(pos => pos.row === row && pos.col === col)) return;

    dragPath.push({ row, col });
    dragWord += board[index];

    const face = document.getElementById(`face-${index}`);
    face.classList.add('highlighted');
    triggerPopAnimation(face);

    // Check if it's still a valid prefix (for visual feedback only)
    checkDragPrefix();
}

// Check if current drag is a valid prefix
function checkDragPrefix() {
    if (!dictionary || dragWord.length === 0) return;

    const lookupWord = dragWord.replace(/Qu/g, 'QU');

    let node = dictionary;
    for (const letter of lookupWord) {
        if (!node[letter]) {
            clearDragPath();
            return;
        }
        node = node[letter];
    }
}

// Undo the last die selection in drag mode
function undoLastDragDieSelection() {
    if (dragPath.length === 0) return;

    const lastPos = dragPath.pop();
    const lastIndex = lastPos.row * 4 + lastPos.col;
    const lastLetter = board[lastIndex];

    if (lastLetter === 'Qu') {
        dragWord = dragWord.slice(0, -2);
    } else {
        dragWord = dragWord.slice(0, -1);
    }

    const face = document.getElementById(`face-${lastIndex}`);
    face.classList.remove('highlighted');

    // Reapply grayed out state if needed
    if (grayedOutPositions.has(`${lastPos.row},${lastPos.col}`)) {
        face.classList.add('grayed-out');
    }
}

// Clear drag path
function clearDragPath() {
    for (const pos of dragPath) {
        const index = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${index}`);
        face.classList.remove('highlighted');

        // Reapply grayed out state if needed
        if (grayedOutPositions.has(`${pos.row},${pos.col}`)) {
            face.classList.add('grayed-out');
        }
    }
    dragPath = [];
    dragWord = '';
}

// Handle pointer up (mouseup or touchend)
function handlePointerUp(e) {
    if (!pressStart) return;

    if (isDragMode) {
        // Check word validity only on release
        validateDragWord();
        clearDragPath();
    }

    pressStart = null;
    isDragMode = false;

    setTimeout(() => {
        preventNextClick = false;
    }, 50);
}

// Validate the drag word on release
function validateDragWord() {
    if (!dictionary || dragWord.length === 0) return;

    const lookupWord = dragWord.replace(/Qu/g, 'QU');

    // Navigate through trie
    let node = dictionary;
    for (const letter of lookupWord) {
        if (!node[letter]) return;
        node = node[letter];
    }

    // Check if it's a complete word (minimum 3 letters)
    if (node['$'] && lookupWord.length >= 3) {
        if (!userFoundWords.has(lookupWord)) {
            addUserWord(lookupWord, [...dragPath]);
        }
    }
}

// Handle die clicks for word building
function handleDieClick(index) {
    // Clear any word highlight on interaction
    clearWordHighlight();

    if (preventNextClick) return;
    if (board[index] === null || isAnimating || hasSolved) return;

    resetIdleTimeout();

    const row = Math.floor(index / 4);
    const col = index % 4;

    const existingIndex = currentPath.findIndex(pos => pos.row === row && pos.col === col);

    if (existingIndex !== -1) {
        clearCurrentPath();
        return;
    }

    if (currentPath.length > 0) {
        const lastPos = currentPath[currentPath.length - 1];
        const rowDiff = Math.abs(row - lastPos.row);
        const colDiff = Math.abs(col - lastPos.col);

        if (rowDiff > 1 || colDiff > 1) {
            clearCurrentPath();
            return;
        }
    }

    currentPath.push({ row, col });
    currentWord += board[index];

    const face = document.getElementById(`face-${index}`);
    face.classList.add('highlighted');
    triggerPopAnimation(face);

    checkCurrentWord();
}

// Trigger pop animation on a die face
function triggerPopAnimation(face) {
    face.classList.remove('pop-animation');
    void face.offsetWidth;
    face.classList.add('pop-animation');
}

// Reset the idle timeout
function resetIdleTimeout() {
    if (idleTimeout) {
        clearTimeout(idleTimeout);
    }
    idleTimeout = setTimeout(() => {
        clearCurrentPath();
    }, 1000);
}

// Clear idle timeout
function clearIdleTimeout() {
    if (idleTimeout) {
        clearTimeout(idleTimeout);
        idleTimeout = null;
    }
}

// Check if current word/path is valid
function checkCurrentWord() {
    if (!dictionary || currentWord.length === 0) return;

    const lookupWord = currentWord.replace(/Qu/g, 'QU');

    let node = dictionary;
    for (const letter of lookupWord) {
        if (!node[letter]) {
            clearCurrentPath();
            return;
        }
        node = node[letter];
    }

    if (node['$'] && lookupWord.length >= 3) {
        if (!userFoundWords.has(lookupWord)) {
            addUserWord(lookupWord, [...currentPath]);
        }
    }
}

// Add a user-found word
function addUserWord(word, path) {
    userFoundWords.set(word, path);
    isUserMode = true;

    if (totalPossibleWords === 0) {
        calculateTotals();
    }

    showFloatingWord(word, path);

    path.forEach((pos) => {
        const dieIndex = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${dieIndex}`);
        triggerPopAnimation(face);
    });

    clearCurrentPath();
    displayUserWords();

    // Update helpful mode display
    if (helpfulMode) {
        updateHelpfulModeDisplay();
    }

    // Check if all words found
    checkAllWordsFound();
}

// Check if all words have been found
function checkAllWordsFound() {
    if (totalPossibleWords > 0 && userFoundWords.size >= totalPossibleWords) {
        // Stop timer if in timed mode
        if (isTimedMode) {
            stopTimer();
        }

        // Show congratulations popup
        congratsPopupOverlay.classList.add('active');
    }
}

// Show floating word animation at centroid of path
function showFloatingWord(word, path) {
    const boardRect = boardContainer.getBoundingClientRect();
    const BAUHAUS_COLORS = getBauhausColors();

    let totalX = 0;
    let totalY = 0;

    const firstPos = path[0];
    const firstDieIndex = firstPos.row * 4 + firstPos.col;
    const firstFace = document.getElementById(`face-${firstDieIndex}`);
    const dieRect = firstFace.getBoundingClientRect();

    const floatingFontSize = dieRect.width * 0.9;

    path.forEach((pos) => {
        const dieIndex = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${dieIndex}`);
        const faceRect = face.getBoundingClientRect();

        totalX += faceRect.left + faceRect.width / 2 - boardRect.left;
        totalY += faceRect.top + faceRect.height / 2 - boardRect.top;
    });

    const centroidX = totalX / path.length;
    const centroidY = totalY / path.length;

    const floatingWord = document.createElement('div');
    floatingWord.className = 'floating-word';
    floatingWord.textContent = word;

    floatingWord.style.left = `${centroidX}px`;
    floatingWord.style.top = `${centroidY}px`;
    floatingWord.style.fontSize = `${floatingFontSize}px`;

    let colorIndex = 0;
    floatingWord.style.color = BAUHAUS_COLORS[colorIndex];

    boardContainer.appendChild(floatingWord);

    const colorInterval = setInterval(() => {
        colorIndex = (colorIndex + 1) % BAUHAUS_COLORS.length;
        floatingWord.style.color = BAUHAUS_COLORS[colorIndex];
    }, 300);

    requestAnimationFrame(() => {
        floatingWord.classList.add('animate');
    });

    setTimeout(() => {
        clearInterval(colorInterval);
        floatingWord.remove();
    }, 1500);
}

// Calculate total possible words and points for the board
function calculateTotals() {
    if (!dictionary || board.some(cell => cell === null)) return;

    allPossibleWords.clear();
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    const grid = [];
    for (let i = 0; i < 4; i++) {
        grid.push(board.slice(i * 4, (i + 1) * 4));
    }

    function dfs(row, col, node, path, visited, positions) {
        if (row < 0 || row >= 4 || col < 0 || col >= 4) return;
        if (visited.has(`${row},${col}`)) return;

        let letter = grid[row][col];
        const lookupLetters = letter === 'Qu' ? ['Q', 'U'] : [letter];

        let currentNode = node;
        for (const l of lookupLetters) {
            if (!currentNode[l]) return;
            currentNode = currentNode[l];
        }

        const newPath = path + letter;
        const newPositions = [...positions, { row, col }];

        if (currentNode['$'] && newPath.length >= 3) {
            const wordKey = newPath.replace(/Qu/g, 'QU');
            if (!allPossibleWords.has(wordKey)) {
                allPossibleWords.set(wordKey, newPositions);
            }
        }

        visited.add(`${row},${col}`);

        for (const [dr, dc] of directions) {
            dfs(row + dr, col + dc, currentNode, newPath, visited, newPositions);
        }

        visited.delete(`${row},${col}`);
    }

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            dfs(row, col, dictionary, '', new Set(), []);
        }
    }

    totalPossibleWords = allPossibleWords.size;
    totalPossiblePoints = 0;
    for (const [word] of allPossibleWords) {
        totalPossiblePoints += calculatePoints(word);
    }
}

// Clear current path and highlights
function clearCurrentPath() {
    clearIdleTimeout();

    for (const pos of currentPath) {
        const index = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${index}`);
        face.classList.remove('highlighted');

        // Reapply grayed out state if needed
        if (grayedOutPositions.has(`${pos.row},${pos.col}`)) {
            face.classList.add('grayed-out');
        }
    }

    currentPath = [];
    currentWord = '';
}

// Display user words
function displayUserWords() {
    const userWordsData = Array.from(userFoundWords.entries()).map(([word, path]) => ({
        word,
        path,
        points: calculatePoints(word),
        isUserWord: true
    }));

    foundWordsData = userWordsData;

    if (helpfulMode && !hasSolved) {
        displayWordsWithHelpfulMode();
    } else {
        displayWords(foundWordsData, false);
    }
}

// Update die size CSS variable
function updateDieSize() {
    const dieContainer = document.querySelector('.die-container');
    if (dieContainer) {
        const size = dieContainer.offsetWidth;
        document.documentElement.style.setProperty('--die-size', `${size}px`);
    }
}

// Load the dictionary trie
async function loadDictionary() {
    try {
        const response = await fetch('dictionary-trie.json');
        dictionary = await response.json();
        console.log('Dictionary loaded successfully');
    } catch (error) {
        console.error('Error loading dictionary:', error);
        dictionary = {};
    }
}

// Setup event listeners
function setupEventListeners() {
    generateBtn.addEventListener('click', showGeneratePopup);
    solveBtn.addEventListener('click', solveBoard);
    randomBtn.addEventListener('click', generateRandomBoard);
    timedBtn.addEventListener('click', generateTimedBoard);
    optimizeBtn.addEventListener('click', generateOptimizedBoard);
    enterBtn.addEventListener('click', showEnterPopup);
    cancelBtn.addEventListener('click', hidePopups);
    enterCancelBtn.addEventListener('click', hidePopups);

    // Settings listeners
    settingsBtn.addEventListener('click', showSettingsPopup);
    settingsCancelBtn.addEventListener('click', hidePopups);
    helpfulModeBtn.addEventListener('click', toggleHelpfulMode);
    timerSettingBtn.addEventListener('click', cycleTimerSetting);
    themeBtn.addEventListener('click', cycleTheme);

    settingsPopupOverlay.addEventListener('click', (e) => {
        if (e.target === settingsPopupOverlay) hidePopups();
    });

    // Times up listeners
    timesUpOkBtn.addEventListener('click', handleTimesUpOk);
    timesUpPopupOverlay.addEventListener('click', (e) => {
        if (e.target === timesUpPopupOverlay) {
            // Don't allow dismissing by clicking outside
        }
    });

    // Congratulations popup listener
    document.getElementById('congratsOkBtn').addEventListener('click', () => {
        congratsPopupOverlay.classList.remove('active');
    });

    congratsPopupOverlay.addEventListener('click', (e) => {
        if (e.target === congratsPopupOverlay) {
            congratsPopupOverlay.classList.remove('active');
        }
    });

    // Solve popup listeners
    document.getElementById('solveConfirmBtn').addEventListener('click', () => {
        solvePopupOverlay.classList.remove('active');
        performSolve();
    });

    document.getElementById('solveCancelBtn').addEventListener('click', () => {
        solvePopupOverlay.classList.remove('active');
        // Don't reset timer - just close the popup
    });

    solvePopupOverlay.addEventListener('click', (e) => {
        if (e.target === solvePopupOverlay) {
            solvePopupOverlay.classList.remove('active');
            // Don't reset timer - just close the popup
        }
    });

    letterInput.addEventListener('input', handleLetterInput);

    window.addEventListener('resize', updateDieSize);

    wordsHeader.addEventListener('click', (e) => {
        if (e.target !== sortBtn) {
            toggleWordsExpanded();
        }
        // Clear word highlight on header interaction
        clearWordHighlight();
    });

    sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSortMode();
        // Clear word highlight on sort
        clearWordHighlight();
    });

    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) hidePopups();
    });
    enterPopupOverlay.addEventListener('click', (e) => {
        if (e.target === enterPopupOverlay) hidePopups();
    });

    // Clear word highlight on any board click
    boardEl.addEventListener('click', (e) => {
        if (e.target === boardEl) {
            clearWordHighlight();
            clearCurrentPath();
        }
    });

    // Clear word highlight on document click (but not on word items)
    document.addEventListener('click', (e) => {
        // Don't clear if clicking on word items or within popups
        if (!e.target.closest('.word-item') &&
            !e.target.closest('.popup-overlay') &&
            !e.target.closest('.settings-btn')) {
            clearWordHighlight();
        }
    });

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchend', handlePointerUp);

    // Clear word highlight on scroll
    wordsContainer.addEventListener('scroll', () => {
        clearWordHighlight();
    });
}

// Toggle sort mode
function toggleSortMode() {
    if (currentSortMode === 'alpha') {
        currentSortMode = 'length';
        sortBtn.textContent = 'PTS';
    } else {
        currentSortMode = 'alpha';
        sortBtn.textContent = 'A-Z';
    }

    if (foundWordsData.length > 0) {
        if (helpfulMode && !hasSolved) {
            displayWordsWithHelpfulMode();
        } else {
            displayWords(foundWordsData, hasSolved);
        }
    }
}

// Toggle words container expanded
function toggleWordsExpanded() {
    wordsExpanded = !wordsExpanded;
    wordsContainer.classList.toggle('expanded', wordsExpanded);

    if (!wordsExpanded) {
        clearWordHighlight();
    }
}

// Show generate popup
function showGeneratePopup() {
    if (isAnimating) return;
    clearWordHighlight();
    popupOverlay.classList.add('active');
}

// Show settings popup
function showSettingsPopup() {
    clearWordHighlight();
    updateSettingsDisplay();
    settingsPopupOverlay.classList.add('active');
}

// Update settings display
function updateSettingsDisplay() {
    helpfulModeBtn.querySelector('.btn-face').textContent = `HELPFUL MODE: ${helpfulMode ? 'ON' : 'OFF'}`;
    helpfulModeBtn.classList.toggle('active', helpfulMode);

    const minutes = Math.floor(timerSettingSeconds / 60);
    const seconds = timerSettingSeconds % 60;
    timerSettingBtn.querySelector('.btn-face').textContent = `TIMER: ${minutes}:${seconds.toString().padStart(2, '0')}`;

    const theme = GAME_THEMES[currentThemeKey];
    themeBtn.querySelector('.btn-face').textContent = `THEME: ${theme.name}`;
}

// Toggle helpful mode
function toggleHelpfulMode() {
    helpfulMode = !helpfulMode;
    updateSettingsDisplay();

    // Update display if game is in progress
    if (board.some(cell => cell !== null) && !hasSolved) {
        // Make sure totals are calculated
        if (totalPossibleWords === 0) {
            calculateTotals();
        }

        if (helpfulMode) {
            updateHelpfulModeDisplay();
        } else {
            // Remove grayed out state from dice
            clearGrayedOutState();
            displayUserWords();
        }
    }
}

// Clear grayed out state from all dice
function clearGrayedOutState() {
    grayedOutPositions.clear();
    for (let i = 0; i < 16; i++) {
        const face = document.getElementById(`face-${i}`);
        if (face) face.classList.remove('grayed-out');
    }
}

// Cycle timer setting
function cycleTimerSetting() {
    timerSettingSeconds += 30;
    if (timerSettingSeconds > 300) {
        timerSettingSeconds = 30;
    }
    updateSettingsDisplay();
}

// Cycle theme
function cycleTheme() {
    const themeKeys = Object.keys(GAME_THEMES);
    const currentIndex = themeKeys.indexOf(currentThemeKey);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    applyTheme(themeKeys[nextIndex]);
    updateSettingsDisplay();
}

// Hide all popups
function hidePopups() {
    popupOverlay.classList.remove('active');
    enterPopupOverlay.classList.remove('active');
    solvePopupOverlay.classList.remove('active');
    settingsPopupOverlay.classList.remove('active');
    letterInput.value = '';
}

// Generate random board with dice rolling animation
async function generateRandomBoard() {
    if (isAnimating) return;

    hidePopups();
    isAnimating = true;
    resetTimerDisplay(); // Reset timer display when generating new board
    clearWords();
    clearWordHighlight();
    clearCurrentPath();
    clearGrayedOutState();

    const diceIndices = shuffleArray([...Array(16).keys()]);

    const newBoard = [];
    for (let i = 0; i < 16; i++) {
        const dieIndex = diceIndices[i];
        const letterIndex = Math.floor(Math.random() * 6);
        newBoard[i] = DICE[dieIndex][letterIndex];
    }

    const animations = [];

    for (let i = 0; i < 16; i++) {
        animations.push(animateDie(i, newBoard[i]));
    }

    await Promise.all(animations);

    board = newBoard;
    isAnimating = false;
    updateSolveButton();

    // Calculate totals and initialize display
    calculateTotals();
    initializeScoreDisplay();

    // Apply helpful mode if active
    if (helpfulMode) {
        updateHelpfulModeDisplay();
    }
}

// Generate optimized board using real Boggle dice
async function generateOptimizedBoard() {
    if (isAnimating) return;

    const face = document.querySelector("#optimizeBtn .btn-face");
    let dots = 0;
    let lastUiYield = Date.now();

    // 1. Unified UI Animation Logic: Updates every 500ms
    const uiInterval = setInterval(() => {
        // Step the "working..." animation
        dots = (dots + 1) % 4;
        face.textContent = "SOLVING" + ".".repeat(dots);

        // Capture current state and print to the custom board preview
        if (enterPopupOverlay.classList.contains('active')) {
            for (let i = 0; i < 16; i++) {
                const previewDie = document.getElementById(`preview-${i}`);
                if (previewDie && board[i]) {
                    previewDie.textContent = board[i];
                    previewDie.classList.add('filled');
                }
            }
            updateEnterDisplay();
        }
    }, 500);

    const OUTER_RESTARTS = 20;
    const INNER_ITERS    = 200;
    const START_TEMP     = 0.6;
    const END_TEMP       = 0.02;

    let bestLetters = null;
    let bestScore = -1;

    function randomBoard() {
        const order = shuffleArray([...Array(16).keys()]);
        const arr = new Array(16);
        for (let i = 0; i < 16; i++) {
            const d = order[i];
            const f = (Math.random() * 6) | 0;
            arr[i] = { die: d, face: f };
        }
        return arr;
    }

    function toLetters(b) {
        return b.map(obj => DICE[obj.die][obj.face]);
    }

    async function score(boardObjects) {
        const letters = toLetters(boardObjects);
        // Sync to global board so the UI Interval can capture the state
        board = letters;
        allPossibleWords.clear();
        calculateTotals();
        return allPossibleWords.size;
    }

    function mutate(b) {
        const clone = b.map(o => ({ die: o.die, face: o.face }));
        const r = Math.random();

        if (r < 0.5) {
            const a = (Math.random() * 16) | 0;
            let  b2 = (Math.random() * 16) | 0;
            if (a === b2) b2 = (b2 + 1) & 15;
            [clone[a], clone[b2]] = [clone[b2], clone[a]];
            return clone;
        }

        const pos = (Math.random() * 16) | 0;
        let nf = (Math.random() * 6) | 0;
        if (clone[pos].face === nf) nf = (nf + 1) % 6;
        clone[pos].face = nf;
        return clone;
    }

    // MAIN OPTIMIZATION LOOP
    for (let r = 0; r < OUTER_RESTARTS; r++) {
        let current = randomBoard();
        let currentScore = await score(current);

        for (let i = 0; i < INNER_ITERS; i++) {
            const mutated = mutate(current);
            const mutatedScore = await score(mutated);

            if (mutatedScore > currentScore) {
                current = mutated;
                currentScore = mutatedScore;
            } else {
                const t = START_TEMP + (i / INNER_ITERS) * (END_TEMP - START_TEMP);
                const ap = Math.exp((mutatedScore - currentScore) / Math.max(t, 0.0001));
                if (Math.random() < ap) {
                    current = mutated;
                    currentScore = mutatedScore;
                }
            }

            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestLetters = toLetters(current);
            }

            // 2. The Yield: Force the engine to pause so the UI interval can run
            // Check if 50ms has passed to allow high performance, but ensuring the
            // 500ms interval logic never gets blocked for more than a few frames.
            if (Date.now() - lastUiYield > 50) {
                await new Promise(resolve => setTimeout(resolve, 0));
                lastUiYield = Date.now();
            }
        }
    }

    // Cleanup UI logic
    clearInterval(uiInterval);
    face.textContent = "MAXIMIZE WORDS";

    // Show bestLetters in UI
    hidePopups();
    isAnimating = true;
    resetTimerDisplay();
    clearWords();
    clearWordHighlight();
    clearCurrentPath();
    clearGrayedOutState();

    const animations = [];
    for (let i = 0; i < 16; i++) {
        animations.push(animateDie(i, bestLetters[i]));
    }
    await Promise.all(animations);

    board = bestLetters;
    isAnimating = false;
    updateSolveButton();
    calculateTotals();
    initializeScoreDisplay();
    if (helpfulMode) updateHelpfulModeDisplay();
}



// Generate timed board
async function generateTimedBoard() {
    if (isAnimating) return;

    hidePopups();
    isAnimating = true;
    resetTimerDisplay(); // Reset first in case there was a previous timer
    isTimedMode = true;
    clearWords();
    clearWordHighlight();
    clearCurrentPath();
    clearGrayedOutState();

    const diceIndices = shuffleArray([...Array(16).keys()]);

    const newBoard = [];
    for (let i = 0; i < 16; i++) {
        const dieIndex = diceIndices[i];
        const letterIndex = Math.floor(Math.random() * 6);
        newBoard[i] = DICE[dieIndex][letterIndex];
    }

    const animations = [];

    for (let i = 0; i < 16; i++) {
        animations.push(animateDie(i, newBoard[i]));
    }

    await Promise.all(animations);

    board = newBoard;
    isAnimating = false;
    updateSolveButton();

    // Calculate totals
    calculateTotals();

    // Initialize score display (without showing totals in timed mode)
    initializeScoreDisplay();

    // Apply helpful mode if active
    if (helpfulMode) {
        updateHelpfulModeDisplay();
    }

    // Start timer after animation completes
    startTimer();
}

// Initialize score display
function initializeScoreDisplay() {
    if (isTimedMode) {
        // In timed mode, don't show totals until time's up
        wordCount.textContent = '0';
        totalPoints.textContent = '0';
    } else {
        // In normal mode, show totals from the start
        wordCount.textContent = `0/${totalPossibleWords}`;
        totalPoints.textContent = `0/${totalPossiblePoints}`;
    }
}

// Start timer
function startTimer() {
    timerSeconds = timerSettingSeconds;

    // Fade out title, fade in timer
    gameTitle.classList.add('hidden');
    timerDisplay.classList.remove('hidden');
    timerDisplay.classList.remove('warning');

    updateTimerDisplay();

    // Wait 1 second before starting countdown
    setTimeout(() => {
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();

            if (timerSeconds <= 30) {
                timerDisplay.classList.add('warning');
            }

            if (timerSeconds <= 0) {
                stopTimer();
                showTimesUp();
            }
        }, 1000);
    }, 1000);
}

// Stop timer
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Show times up popup
function showTimesUp() {
    const percent = totalPossibleWords > 0
        ? Math.round((userFoundWords.size / totalPossibleWords) * 100)
        : 0;
    timesUpStats.textContent = `${percent}% FOUND`;
    timesUpPopupOverlay.classList.add('active');
}

// Handle times up OK button
function handleTimesUpOk() {
    timesUpPopupOverlay.classList.remove('active');

    // Trigger solve
    performSolve();

    // Fade out timer, fade in title
    timerDisplay.classList.add('hidden');
    gameTitle.classList.remove('hidden');
}

// Update helpful mode display
function updateHelpfulModeDisplay() {
    if (!helpfulMode || hasSolved) return;

    // Make sure totals are calculated
    if (allPossibleWords.size === 0) {
        calculateTotals();
    }

    // Find unfound words and update word list display
    displayWordsWithHelpfulMode();

    // Gray out dice that are no longer used in unfound words
    updateGrayedOutDice();
}

// Display words with helpful mode (showing ? for unfound words)
function displayWordsWithHelpfulMode() {
    if (!helpfulMode) {
        displayWords(foundWordsData, false);
        return;
    }

    const allWordsData = [];

    // Add user found words
    for (const [word, path] of userFoundWords.entries()) {
        allWordsData.push({
            word,
            path,
            points: calculatePoints(word),
            isUserWord: true,
            isHidden: false
        });
    }

    // Add unfound words as hidden (with ?)
    for (const [word, path] of allPossibleWords.entries()) {
        if (!userFoundWords.has(word)) {
            allWordsData.push({
                word,
                path,
                points: calculatePoints(word),
                isUserWord: false,
                isHidden: true
            });
        }
    }

    foundWordsData = allWordsData;
    displayWords(foundWordsData, false, true);
}

// Update grayed out dice based on positions used in unfound words
function updateGrayedOutDice() {
    // Find which dice POSITIONS are still used in unfound words
    const usedPositions = new Set();

    for (const [word, path] of allPossibleWords.entries()) {
        if (!userFoundWords.has(word)) {
            // This word hasn't been found yet, so all positions in its path are still needed
            for (const pos of path) {
                usedPositions.add(`${pos.row},${pos.col}`);
            }
        }
    }

    // Update grayed out positions set
    grayedOutPositions.clear();

    // Update dice appearance
    for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const posKey = `${row},${col}`;
        const face = document.getElementById(`face-${i}`);

        if (usedPositions.has(posKey)) {
            // This position is still needed for unfound words
            face.classList.remove('grayed-out');
        } else {
            // This position is not needed anymore
            face.classList.add('grayed-out');
            grayedOutPositions.add(posKey);
        }
    }
}

/**
 * Creates and runs the 3D die animation, then transitions to the static face.
 */
function animateDie(index, letter) {
    return new Promise((resolve) => {
        const die = document.getElementById(`die-${index}`);
        const face = document.getElementById(`face-${index}`);

        face.classList.remove('visible');
        face.classList.remove('pop-animation');
        face.classList.remove('grayed-out');
        face.innerHTML = '';

        const duration = 1000 + Math.random() * 1000;

        const die3d = create3DDie();
        die.appendChild(die3d);

        const x = Math.random() * 2 - 1;
        const y = Math.random() * 2 - 1;
        const z = Math.random() * 2 - 1;
        const spinDeg = 720 + Math.random() * 360;

        const finalTransform = `
            rotateX(0deg)
            rotateY(0deg)
            rotateZ(0deg)
        `;

        const animation = die3d.animate(
            [
                {
                    transform: `rotate3d(${x}, ${y}, ${z}, ${spinDeg}deg)`
                },
                {
                    transform: finalTransform
                }
            ],
            {
                duration,
                easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
                fill: 'forwards'
            }
        );

        animation.onfinish = () => {
            die3d.remove();
            setDieLetter(face, letter, true);
            face.offsetHeight;
            face.classList.add('visible');

            // Apply die color
            applyDieColors();

            resolve();
        };
    });
}

// Create a 3D die element for animation
function create3DDie() {
    const die3d = document.createElement('div');
    die3d.className = 'die-3d';

    const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
    faces.forEach(faceName => {
        const face = document.createElement('div');
        face.className = `face face-${faceName}`;
        die3d.appendChild(face);
    });

    return die3d;
}

function setDieLetter(face, letter, isDice = true) {
    face.innerHTML = '';

    if (letter === 'Qu') {
        if (isDice) {
            face.innerHTML =
                '<span class="die-letter">' +
                '<span class="letter-q">Q</span>' +
                '<span class="letter-u">u</span>' +
                '</span>';
        } else {
            return 'QU';
        }
    } else {
        face.innerHTML = `<span class="die-letter">${letter}</span>`;
    }

    return letter;
}

// Show enter letters popup
let currentEnterIndex = 0;

function showEnterPopup() {
    hidePopups();
    currentEnterIndex = 0;
    board = Array(16).fill(null);
    resetTimerDisplay(); // Reset timer when entering letters
    clearWordHighlight();
    clearWords();
    clearGrayedOutState();

    for (let i = 0; i < 16; i++) {
        const face = document.getElementById(`face-${i}`);
        face.innerHTML = '';
        face.classList.remove('visible');
        face.classList.remove('pop-animation');
        face.classList.remove('grayed-out');
    }

    enterPreview.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const previewDie = document.createElement('div');
        previewDie.className = 'preview-die';
        previewDie.id = `preview-${i}`;
        if (i === 0) previewDie.classList.add('current');
        enterPreview.appendChild(previewDie);

        previewDie.addEventListener('click', () => handlePreviewDieClick(i));
    }

    updateEnterDisplay();
    enterPopupOverlay.classList.add('active');
}

// Handle click on a preview die
function handlePreviewDieClick(index) {
    currentEnterIndex = index;
    updateEnterDisplay();
    letterInput.focus();
}

// Update the enter popup display
function updateEnterDisplay() {
    currentDieNum.textContent = currentEnterIndex + 1;

    for (let i = 0; i < 16; i++) {
        const previewDie = document.getElementById(`preview-${i}`);
        previewDie.className = 'preview-die';

        if (board[i]) {
            previewDie.classList.add('filled');
            if (board[i] === 'Qu') {
                previewDie.innerHTML = 'Qu';
            } else {
                previewDie.textContent = board[i];
            }
        } else if (i === currentEnterIndex) {
            previewDie.classList.add('current');
            previewDie.textContent = '';
        } else {
            previewDie.textContent = '';
        }
    }
}

// Handle letter input
function handleLetterInput(e) {
    let value = e.target.value.toUpperCase();

    if (value.length === 0) return;

    let letter;
    if (value[0] === 'Q') {
        letter = 'Qu';
    } else if (/^[A-Z]$/.test(value[0])) {
        letter = value[0];
    } else {
        letterInput.value = '';
        return;
    }

    board[currentEnterIndex] = letter;

    const face = document.getElementById(`face-${currentEnterIndex}`);
    setDieLetter(face, letter, true);
    face.classList.add('visible');
    applyDieColors();

    currentEnterIndex++;
    letterInput.value = '';

    if (currentEnterIndex >= 16) {
        hidePopups();
        updateSolveButton();

        // Calculate totals and initialize display
        calculateTotals();
        initializeScoreDisplay();

        if (helpfulMode) {
            updateHelpfulModeDisplay();
        }
    } else {
        updateEnterDisplay();
        letterInput.focus();
    }
}

// Update solve button state
function updateSolveButton() {
    const isBoardFull = board.every(cell => cell !== null);
    solveBtn.disabled = !isBoardFull || isAnimating;
}

// Clear words display
function clearWords() {
    wordsList.innerHTML = '';
    wordCount.textContent = '0';
    totalPoints.textContent = '0';
    foundWordsData = [];
    selectedWord = null;
    userFoundWords.clear();
    isUserMode = false;
    hasSolved = false;
    totalPossibleWords = 0;
    totalPossiblePoints = 0;
    allPossibleWords.clear();
    clearCurrentPath();
    clearGrayedOutState();
}

// Solve the board
function solveBoard() {
    // Don't allow solving while animating
    if (isAnimating) return;
    if (!dictionary || board.some(cell => cell === null)) return;

    if (isUserMode && !hasSolved) {
        solvePopupOverlay.classList.add('active');
        return;
    }

    performSolve();
}

// Perform the actual solve
function performSolve() {
    clearWordHighlight();
    clearCurrentPath();
    hasSolved = true;

    // Stop timer if running and reset display
    resetTimerDisplay();

    // Remove grayed out state
    clearGrayedOutState();

    // Recalculate if needed
    if (allPossibleWords.size === 0) {
        calculateTotals();
    }

    // Build the display data
    const allWordsData = [];

    if (isUserMode) {
        for (const [word, path] of userFoundWords.entries()) {
            allWordsData.push({
                word,
                path,
                points: calculatePoints(word),
                isUserWord: true
            });
        }

        for (const [word, path] of allPossibleWords.entries()) {
            if (!userFoundWords.has(word)) {
                allWordsData.push({
                    word,
                    path,
                    points: calculatePoints(word),
                    isUserWord: false
                });
            }
        }
    } else {
        for (const [word, path] of allPossibleWords.entries()) {
            allWordsData.push({
                word,
                path,
                points: calculatePoints(word),
                isUserWord: false
            });
        }
    }

    foundWordsData = allWordsData;
    displayWords(foundWordsData, true);
}

// Calculate points for a word
function calculatePoints(word) {
    const length = word.length;
    if (length <= 4) return 1;
    return length - 3;
}

// Display found words
function displayWords(wordsData, isSolveDisplay = false, isHelpfulModeDisplay = false) {
    wordsList.innerHTML = '';

    if (wordsData.length === 0 && !isUserMode) {
        const noWordsMsg = document.createElement('div');
        noWordsMsg.className = 'no-words-message';
        noWordsMsg.textContent = 'NO WORDS FOUND';
        wordsList.appendChild(noWordsMsg);
        wordCount.textContent = '0';
        totalPoints.textContent = '0';
        return;
    }

    // Sort based on current mode
    let sortedWords;
    if (currentSortMode === 'length') {
        sortedWords = [...wordsData].sort((a, b) => {
            if (b.word.length !== a.word.length) return b.word.length - a.word.length;
            return a.word.localeCompare(b.word);
        });
    } else {
        sortedWords = [...wordsData].sort((a, b) => a.word.localeCompare(b.word));
    }

    let userTotal = 0;
    let userCount = 0;

    sortedWords.forEach(({ word, points, path, isUserWord, isHidden }) => {
        if (isUserWord === true) {
            userTotal += points;
            userCount++;
        }

        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';

        // Add inverted class for missed words or all words in direct solve
        if (isUserWord === false) {
            wordItem.classList.add('inverted');
        }

        if (selectedWord === word) {
            wordItem.classList.add('selected');
        }

        // Display word or question marks
        const displayWord = isHidden ? '?'.repeat(word.length) : word;

        wordItem.innerHTML = `
            <span class="word">${displayWord}</span>
            <span class="points">${points}</span>
        `;

        wordItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isHidden) {
                selectWord(word, path);
            }
        });

        wordsList.appendChild(wordItem);
    });

    // Update counts
    if (isSolveDisplay && !isUserMode) {
        // Direct solve - just show totals without fraction
        wordCount.textContent = totalPossibleWords;
        totalPoints.textContent = totalPossiblePoints;
    } else if (isTimedMode && !hasSolved) {
        // Timed mode before time's up - don't show totals
        wordCount.textContent = userCount;
        totalPoints.textContent = userTotal;
    } else if ((isUserMode || isHelpfulModeDisplay) && totalPossibleWords > 0) {
        // User mode or helpful mode - show fraction
        wordCount.textContent = `${userCount}/${totalPossibleWords}`;
        totalPoints.textContent = `${userTotal}/${totalPossiblePoints}`;
    } else {
        // User mode but totals not calculated yet
        wordCount.textContent = userCount;
        totalPoints.textContent = userTotal;
    }
}

// Select a word and show its path
function selectWord(word, path) {
    if (wordsExpanded) {
        toggleWordsExpanded();
    }

    if (selectedWord === word) {
        clearWordHighlight();
        return;
    }

    selectedWord = word;

    document.querySelectorAll('.word-item').forEach(item => {
        item.classList.remove('selected');
        if (item.querySelector('.word').textContent === word) {
            item.classList.add('selected');
        }
    });

    clearDiceHighlights();

    path.forEach((pos) => {
        const dieIndex = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${dieIndex}`);
        face.classList.add('highlighted');
        // Note: we don't remove grayed-out here - highlighting works on top of grayed out
    });

    drawPath(path);
}

// Clear word highlight
function clearWordHighlight() {
    if (selectedWord === null) return;

    selectedWord = null;
    clearDiceHighlights();
    clearPathOverlay();

    document.querySelectorAll('.word-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// Clear dice highlights (but preserve grayed out state)
function clearDiceHighlights() {
    for (let i = 0; i < 16; i++) {
        const face = document.getElementById(`face-${i}`);
        face.classList.remove('highlighted');
        // Don't touch grayed-out class - it should persist
    }
}

// Clear path overlay
function clearPathOverlay() {
    const elements = pathOverlay.querySelectorAll('line, circle, path');
    elements.forEach(el => el.remove());
}

// Draw path on the board
function drawPath(positions) {
    clearPathOverlay();

    if (positions.length < 2) return;

    const overlayRect = pathOverlay.getBoundingClientRect();

    const dieCenters = positions.map(pos => {
        const dieIndex = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${dieIndex}`);
        const faceRect = face.getBoundingClientRect();

        return {
            x: faceRect.left + faceRect.width / 2 - overlayRect.left,
            y: faceRect.top + faceRect.height / 2 - overlayRect.top
        };
    });

    for (let i = 0; i < dieCenters.length - 1; i++) {
        const start = dieCenters[i];
        const end = dieCenters[i + 1];

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        const offset = 18;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', start.x + unitX * offset);
        line.setAttribute('y1', start.y + unitY * offset);
        line.setAttribute('x2', end.x - unitX * offset);
        line.setAttribute('y2', end.y - unitY * offset);

        if (i === dieCenters.length - 2) {
            line.setAttribute('marker-end', 'url(#arrowhead)');
        }

        pathOverlay.appendChild(line);
    }
}

// Utility: Shuffle array (Fisher-Yates)
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);