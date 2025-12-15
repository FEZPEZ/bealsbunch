//----------------------------------------------
// BOGGLE SOLVER APP - BAUHAUS EDITION
//----------------------------------------------

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

// Bauhaus color palette for word popup
const BAUHAUS_COLORS = [
    '#d94527', // red
    '#f5a845', // yellow
    '#24a482', // green
    '#756c8c', // purple
    '#464167'  // dark
];

// Game state
let board = Array(16).fill(null);
let dictionary = null;
let isAnimating = false;
let foundWordsData = [];
let currentSortMode = 'alpha'; // 'alpha' or 'points'
let selectedWord = null;
let wordsExpanded = false;

// User interaction state
let userFoundWords = new Map(); // Store user-found words and their paths
let currentPath = []; // Current path being built by clicking
let currentWord = ''; // Current word being built
let isUserMode = false; // Track if user has found any words
let idleTimeout = null; // Timeout for clearing idle selection
let totalPossibleWords = 0; // Total possible words on board
let totalPossiblePoints = 0; // Total possible points on board
let hasSolved = false; // Track if solve has been used

// Drag state
let isDragMode = false;
let pressStart = null;
let preventNextClick = false;
const DRAG_THRESHOLD = 10; // pixels to move before entering drag mode
const DRAG_HITBOX_EDGE_SHRINK_PERCENT = 0.15;

// DOM Elements
const boardEl = document.getElementById('board');
const generateBtn = document.getElementById('generateBtn');
const solveBtn = document.getElementById('solveBtn');
const popupOverlay = document.getElementById('popupOverlay');
const enterPopupOverlay = document.getElementById('enterPopupOverlay');
const randomBtn = document.getElementById('randomBtn');
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

// Initialize the app
async function init() {
    document.body.appendChild(solvePopupOverlay);
    createBoard();
    await loadDictionary();
    setupEventListeners();
    updateSolveButton();
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

        // Create the visible face
        const face = document.createElement('div');
        face.className = 'die-face';
        face.id = `face-${i}`;

        const faceInner = document.createElement('div');
        faceInner.className = 'die-face-inner';

        face.appendChild(faceInner);
        die.appendChild(face);

        // Add pointer down handlers for drag detection
        face.addEventListener('mousedown', (e) => handlePointerDown(e, i));
        face.addEventListener('touchstart', (e) => handlePointerDown(e, i), { passive: false });

        // Add click listener for word building (tap mode)
        face.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDieClick(i);
        });

        dieContainer.appendChild(die);
        boardEl.appendChild(dieContainer);
    }

    updateDieSize();
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
            // Shrink hitbox by 25% on each side for easier diagonal navigation
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
    if (board[index] === null || isAnimating || hasSolved) return;

    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;
    pressStart = {
        index: index,
        x: point.clientX,
        y: point.clientY
    };
    isDragMode = false;
}

// Handle pointer move (mousemove or touchmove)
function handlePointerMove(e) {
    if (!pressStart) return;

    const point = e.touches ? e.touches[0] : e;

    if (!isDragMode) {
        // Check if moved enough to enter drag mode
        const dx = point.clientX - pressStart.x;
        const dy = point.clientY - pressStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > DRAG_THRESHOLD) {
            // Enter drag mode
            isDragMode = true;
            preventNextClick = true;
            clearIdleTimeout(); // No idle timeout in drag mode

            // Clear any existing path from tap mode
            clearCurrentPath();

            // Activate the starting die
            activateDieForDrag(pressStart.index);
        }
    }

    if (isDragMode) {
        e.preventDefault(); // Prevent scrolling while dragging
        handleDragOver(point.clientX, point.clientY);
    }
}

// Handle dragging over dice
function handleDragOver(x, y) {
    // Use smaller hitbox for easier diagonal navigation
    const dieIndex = getDieIndexFromPoint(x, y, true);

    if (dieIndex === -1) return;
    if (board[dieIndex] === null) return;

    const row = Math.floor(dieIndex / 4);
    const col = dieIndex % 4;

    // Check for backtracking (moving to previous die)
    if (currentPath.length >= 2) {
        const prevPos = currentPath[currentPath.length - 2];
        if (prevPos.row === row && prevPos.col === col) {
            undoLastDieSelection();
            return;
        }
    }

    // Check if this die is already in the current path
    const existingIndex = currentPath.findIndex(pos => pos.row === row && pos.col === col);
    if (existingIndex !== -1) return; // Already selected

    // Check adjacency if path is not empty
    if (currentPath.length > 0) {
        const lastPos = currentPath[currentPath.length - 1];
        const rowDiff = Math.abs(row - lastPos.row);
        const colDiff = Math.abs(col - lastPos.col);

        if (rowDiff > 1 || colDiff > 1) {
            // Not adjacent - invalid move, clear path
            clearCurrentPath();
            return;
        }
    }

    // Activate this die
    activateDieForDrag(dieIndex);
}

// Activate a die in drag mode
function activateDieForDrag(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;

    // Safety check - don't add if already in path
    if (currentPath.some(pos => pos.row === row && pos.col === col)) return;

    currentPath.push({ row, col });
    currentWord += board[index];

    const face = document.getElementById(`face-${index}`);
    face.classList.add('highlighted');
    triggerPopAnimation(face);

    // Check word validity
    checkCurrentWordDrag();
}

// Check current word in drag mode
function checkCurrentWordDrag() {
    if (!dictionary || currentWord.length === 0) return;

    const lookupWord = currentWord.replace(/Qu/g, 'QU');

    // Navigate through trie to check if path is valid PREFIX
    let node = dictionary;
    for (const letter of lookupWord) {
        if (!node[letter]) {
            // Not a valid prefix - clear immediately
            clearCurrentPath();
            return;
        }
        node = node[letter];
    }

    // Check if it's a complete word (minimum 3 letters)
    if (node['$'] && lookupWord.length >= 3) {
        if (!userFoundWords.has(lookupWord)) {
            addUserWord(lookupWord, [...currentPath]);
            // addUserWord clears the path, allowing new word to start
        }
    }
}

// Undo the last die selection (for backtracking in drag mode)
function undoLastDieSelection() {
    if (currentPath.length === 0) return;

    const lastPos = currentPath.pop();
    const lastIndex = lastPos.row * 4 + lastPos.col;
    const lastLetter = board[lastIndex];

    // Remove letter(s) from currentWord
    if (lastLetter === 'Qu') {
        currentWord = currentWord.slice(0, -2);
    } else {
        currentWord = currentWord.slice(0, -1);
    }

    // Remove highlight from the die
    const face = document.getElementById(`face-${lastIndex}`);
    face.classList.remove('highlighted');
}

// Handle pointer up (mouseup or touchend)
function handlePointerUp(e) {
    if (!pressStart) return;

    if (isDragMode) {
        // Was dragging - auto cancel on release
        clearCurrentPath();
    }
    // If not dragging, the click event will fire and handle it via handleDieClick

    pressStart = null;
    isDragMode = false;

    // Reset preventNextClick after a delay to allow click event to check it
    setTimeout(() => {
        preventNextClick = false;
    }, 50);
}

// Handle die clicks for word building
function handleDieClick(index) {
    // Don't handle if this click came from a drag release
    if (preventNextClick) return;

    // Don't allow clicking if board isn't ready, animating, or already solved
    if (board[index] === null || isAnimating || hasSolved) return;

    // Reset idle timeout
    resetIdleTimeout();

    const row = Math.floor(index / 4);
    const col = index % 4;

    // Check if this die is already in the current path
    const existingIndex = currentPath.findIndex(pos => pos.row === row && pos.col === col);

    if (existingIndex !== -1) {
        // Die is already selected - clear everything
        clearCurrentPath();
        return;
    }

    // Check if this die is adjacent to the last selected die (or if it's the first)
    if (currentPath.length > 0) {
        const lastPos = currentPath[currentPath.length - 1];
        const rowDiff = Math.abs(row - lastPos.row);
        const colDiff = Math.abs(col - lastPos.col);

        // Not adjacent (including diagonals)
        if (rowDiff > 1 || colDiff > 1) {
            // Invalid move - clear everything
            clearCurrentPath();
            return;
        }
    }

    // Add to path
    currentPath.push({ row, col });
    currentWord += board[index];

    // Highlight the die and trigger pop animation
    const face = document.getElementById(`face-${index}`);
    face.classList.add('highlighted');
    triggerPopAnimation(face);

    // Check the word immediately
    checkCurrentWord();
}

// Trigger pop animation on a die face
function triggerPopAnimation(face) {
    face.classList.remove('pop-animation');
    void face.offsetWidth; // Force reflow
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

    // Convert Qu to QU for dictionary lookup
    const lookupWord = currentWord.replace(/Qu/g, 'QU');

    // Navigate through trie to check if path is valid PREFIX in the dictionary
    let node = dictionary;
    for (const letter of lookupWord) {
        if (!node[letter]) {
            // Not a valid prefix in the entire dictionary - clear immediately
            clearCurrentPath();
            return;
        }
        node = node[letter];
    }

    // Check if it's a complete word (minimum 3 letters)
    if (node['$'] && lookupWord.length >= 3) {
        // Check if word was already found by user
        if (!userFoundWords.has(lookupWord)) {
            // New word found!
            addUserWord(lookupWord, [...currentPath]);
        }
        // If word already found, do NOT clear - allow building longer words
    }
    // If we get here with a valid prefix, keep the path active
}

// Add a user-found word
function addUserWord(word, path) {
    userFoundWords.set(word, path);
    isUserMode = true;

    // Calculate totals if not done yet
    if (totalPossibleWords === 0) {
        calculateTotals();
    }

    // Show floating word animation
    showFloatingWord(word, path);

    // Trigger pop animation on all dice in path
    path.forEach((pos) => {
        const dieIndex = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${dieIndex}`);
        triggerPopAnimation(face);
    });

    // Clear path immediately (removes highlights)
    clearCurrentPath();

    // Update display
    displayUserWords();
}
// Show floating word animation at centroid of path
function showFloatingWord(word, path) {
    const boardRect = boardContainer.getBoundingClientRect();

    let totalX = 0;
    let totalY = 0;

    // Use the first die to derive size (all dice are same size)
    const firstPos = path[0];
    const firstDieIndex = firstPos.row * 4 + firstPos.col;
    const firstFace = document.getElementById(`face-${firstDieIndex}`);
    const dieRect = firstFace.getBoundingClientRect();

    const floatingFontSize = dieRect.width * 0.9; // <-- THIS IS THE KEY

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

    // 🔑 bind font size to die size
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

    const foundWords = new Map();
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
            if (!foundWords.has(wordKey)) {
                foundWords.set(wordKey, newPositions);
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

    totalPossibleWords = foundWords.size;
    totalPossiblePoints = 0;
    for (const [word] of foundWords) {
        totalPossiblePoints += calculatePoints(word);
    }
}

// Clear current path and highlights
function clearCurrentPath() {
    clearIdleTimeout();

    // Clear all highlights
    for (const pos of currentPath) {
        const index = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${index}`);
        face.classList.remove('highlighted');
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
    displayWords(foundWordsData, false);
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
    enterBtn.addEventListener('click', showEnterPopup);
    cancelBtn.addEventListener('click', hidePopups);
    enterCancelBtn.addEventListener('click', hidePopups);

    // Solve popup listeners
    document.getElementById('solveConfirmBtn').addEventListener('click', () => {
        solvePopupOverlay.classList.remove('active');
        performSolve();
    });

    document.getElementById('solveCancelBtn').addEventListener('click', () => {
        solvePopupOverlay.classList.remove('active');
    });

    solvePopupOverlay.addEventListener('click', (e) => {
        if (e.target === solvePopupOverlay) {
            solvePopupOverlay.classList.remove('active');
        }
    });

    letterInput.addEventListener('input', handleLetterInput);

    window.addEventListener('resize', updateDieSize);

    // Words header click to toggle expand (but not on sort button)
    wordsHeader.addEventListener('click', (e) => {
        if (e.target !== sortBtn) {
            toggleWordsExpanded();
        }
    });

    // Sort button click
    sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSortMode();
    });

    // Close popup on overlay click
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) hidePopups();
    });
    enterPopupOverlay.addEventListener('click', (e) => {
        if (e.target === enterPopupOverlay) hidePopups();
    });

    // Click outside to deselect word and clear current path
    boardEl.addEventListener('click', (e) => {
        if (e.target === boardEl) {
            clearWordHighlight();
            clearCurrentPath();
        }
    });

    // Document-level move and up handlers for drag functionality
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchend', handlePointerUp);
}

// Toggle sort mode
function toggleSortMode() {
    if (currentSortMode === 'alpha') {
        currentSortMode = 'points';
        sortBtn.textContent = 'PTS';
    } else {
        currentSortMode = 'alpha';
        sortBtn.textContent = 'A-Z';
    }

    if (foundWordsData.length > 0) {
        displayWords(foundWordsData, hasSolved);
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
    popupOverlay.classList.add('active');
}

// Hide all popups
function hidePopups() {
    popupOverlay.classList.remove('active');
    enterPopupOverlay.classList.remove('active');
    solvePopupOverlay.classList.remove('active');
    letterInput.value = '';
}

// Generate random board with dice rolling animation
async function generateRandomBoard() {
    if (isAnimating) return;

    hidePopups();
    isAnimating = true;
    clearWords();
    clearWordHighlight();
    clearCurrentPath();

    // Shuffle dice positions
    const diceIndices = shuffleArray([...Array(16).keys()]);

    // Generate random letters for each die
    const newBoard = [];
    for (let i = 0; i < 16; i++) {
        const dieIndex = diceIndices[i];
        const letterIndex = Math.floor(Math.random() * 6);
        newBoard[i] = DICE[dieIndex][letterIndex];
    }

    // Animate each die
    const animations = [];

    for (let i = 0; i < 16; i++) {
        animations.push(animateDie(i, newBoard[i]));
    }

    // Wait for all animations to complete
    await Promise.all(animations);

    board = newBoard;
    isAnimating = false;
    updateSolveButton();
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
    clearWordHighlight();
    clearWords();

    // Clear all die faces
    for (let i = 0; i < 16; i++) {
        const face = document.getElementById(`face-${i}`);
        face.innerHTML = '';
        face.classList.remove('visible');
        face.classList.remove('pop-animation');
    }

    // Create preview grid
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

    currentEnterIndex++;
    letterInput.value = '';

    if (currentEnterIndex >= 16) {
        hidePopups();
        updateSolveButton();
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
    clearCurrentPath();
}

// Solve the board
function solveBoard() {
    if (!dictionary || board.some(cell => cell === null)) return;

    // If user has found words, show confirmation popup
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

    const foundWords = new Map();
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
            if (!foundWords.has(wordKey)) {
                foundWords.set(wordKey, newPositions);
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

    // Update totals
    totalPossibleWords = foundWords.size;
    totalPossiblePoints = 0;
    for (const [word] of foundWords) {
        totalPossiblePoints += calculatePoints(word);
    }

    // Build the display data
    const allWordsData = [];

    if (isUserMode) {
        // User played - show their words normally, missed words inverted
        for (const [word, path] of userFoundWords.entries()) {
            allWordsData.push({
                word,
                path,
                points: calculatePoints(word),
                isUserWord: true
            });
        }

        // Add missed words as inverted
        for (const [word, path] of foundWords.entries()) {
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
        // Direct solve - show all words in inverted/gray style
        for (const [word, path] of foundWords.entries()) {
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
function displayWords(wordsData, isSolveDisplay = false) {
    wordsList.innerHTML = '';

    // Check if no words found
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
    if (currentSortMode === 'points') {
        sortedWords = [...wordsData].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.word.localeCompare(b.word);
        });
    } else {
        sortedWords = [...wordsData].sort((a, b) => a.word.localeCompare(b.word));
    }

    let userTotal = 0;
    let userCount = 0;

    sortedWords.forEach(({ word, points, path, isUserWord }) => {
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

        wordItem.innerHTML = `
            <span class="word">${word}</span>
            <span class="points">${points}</span>
        `;

        wordItem.addEventListener('click', (e) => {
            e.stopPropagation();
            selectWord(word, path);
        });

        wordsList.appendChild(wordItem);
    });

    // Update counts
    if (isSolveDisplay && !isUserMode) {
        // Direct solve - just show totals without fraction
        wordCount.textContent = totalPossibleWords;
        totalPoints.textContent = totalPossiblePoints;
    } else if (isUserMode && totalPossibleWords > 0) {
        // User mode - show fraction
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
    });

    drawPath(path);
}

// Clear word highlight
function clearWordHighlight() {
    selectedWord = null;
    clearDiceHighlights();
    clearPathOverlay();

    document.querySelectorAll('.word-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// Clear dice highlights
function clearDiceHighlights() {
    for (let i = 0; i < 16; i++) {
        const face = document.getElementById(`face-${i}`);
        face.classList.remove('highlighted');
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