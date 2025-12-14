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

// Game state
let board = Array(16).fill(null);
let dictionary = null;
let isAnimating = false;
let foundWordsData = [];
let currentSortMode = 'alpha'; // 'alpha' or 'points'
let selectedWord = null;
let wordsExpanded = false;

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

// Initialize the app
async function init() {
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

        dieContainer.appendChild(die);
        boardEl.appendChild(dieContainer);
    }

    updateDieSize();
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

    // Click outside to deselect word
    boardEl.addEventListener('click', (e) => {
        if (e.target === boardEl) {
            clearWordHighlight();
        }
    });
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
        displayWords(foundWordsData);
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
    letterInput.value = '';
}

// Generate random board with dice rolling animation
async function generateRandomBoard() {
    if (isAnimating) return;

    hidePopups();
    isAnimating = true;
    clearWords();
    clearWordHighlight();

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

// script.js (around line 160)

/**
 * Creates and runs the 3D die animation, then transitions to the static face.
 * @param {number} index The index of the die (0-15).
 * @param {string} letter The letter to display on the final face.
 * @returns {Promise<void>} A promise that resolves when the animation and cleanup are complete.
 */
function animateDie(index, letter) {
    return new Promise((resolve) => {
        const die = document.getElementById(`die-${index}`);
        const face = document.getElementById(`face-${index}`);

        // 1. Prepare static face: ensure it's hidden before the animation starts
        face.classList.remove('visible');
        face.innerHTML = '';

        const duration = 1000 + Math.random() * 1000;

        // 2. Create and append the 3D die
        const die3d = create3DDie();
        die.appendChild(die3d);

        // Calculate a random, long, spinning rotation
        const x = Math.random() * 2 - 1; // -1 to 1
        const y = Math.random() * 2 - 1;
        const z = Math.random() * 2 - 1;
        const spinDeg = 720 + Math.random() * 360; // Spin between 2 and 3 full rotations

        // FINAL orientation that puts WHITE face on top (always 0, 0, 0 for the front face)
        const finalTransform = `
            rotateX(0deg)
            rotateY(0deg)
            rotateZ(0deg)
        `;

        // 3. Run the animation
        const animation = die3d.animate(
            [
                {
                    transform: `
                        rotate3d(${x}, ${y}, ${z}, ${spinDeg}deg)
                    `
                },
                {
                    transform: finalTransform
                }
            ],
            {
                duration,
                easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // pure deceleration
                fill: 'forwards'
            }
        );

        // 4. Cleanup and transition when the animation is FINISHED
        animation.onfinish = () => {
            console.log(`[DEBUG] Animation Finished for Die ${index}`);

            // A. Remove the 3D element
            die3d.remove();

            // B. Set the letter on the static face
            setDieLetter(face, letter, true);

            // C. FORCE REFLOW/REPAINT (CRITICAL FIX FOR DISAPPEARING ELEMENTS)
            // Reading offsetHeight forces the browser to recalculate element layout,
            // reliably clearing the rendering buffer from the heavy 3D transform.
            face.offsetHeight;

            // D. Show the static face (triggers the CSS pop animation)
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

// Generate rotation animation keyframes - all axes rotate simultaneously
function generateRotationAnimation(index, duration) {
    // Each axis gets random k between 2-4 and random direction
    const axes = ['X', 'Y', 'Z'];
    const rotations = {};

    axes.forEach(axis => {
        const k = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
        const direction = Math.random() < 0.5 ? 1 : -1;
        rotations[axis] = k * 360 * direction;
    });

    // Generate keyframes with all rotations happening simultaneously
    const steps = 60;
    let keyframeStr = `@keyframes roll-${index} {\n`;

    for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const percent = (progress * 100).toFixed(2);

        // Ease out cubic for deceleration
        const eased = 1 - Math.pow(1 - progress, 3);

        const rotX = eased * rotations.X;
        const rotY = eased * rotations.Y;
        const rotZ = eased * rotations.Z;

        keyframeStr += `  ${percent}% { transform: rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg); }\n`;
    }

    keyframeStr += '}';
    return { keyframes: keyframeStr };
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

    // Clear all die faces
    for (let i = 0; i < 16; i++) {
        const face = document.getElementById(`face-${i}`);
        face.innerHTML = '';
        face.classList.remove('visible');
    }

    // Create preview grid
    enterPreview.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const previewDie = document.createElement('div');
        previewDie.className = 'preview-die';
        previewDie.id = `preview-${i}`;
        if (i === 0) previewDie.classList.add('current');
        enterPreview.appendChild(previewDie);

        // NEW: Add click listener to select the die and focus the input
        previewDie.addEventListener('click', () => handlePreviewDieClick(i));
    }

    updateEnterDisplay();
    enterPopupOverlay.classList.add('active');

    // NOTE: Removed the unreliable auto-focus with setTimeout.
    // The user must now click a preview die to begin typing and trigger the keyboard.
}

// Handle click on a preview die to select it and focus the input
function handlePreviewDieClick(index) {
    currentEnterIndex = index;
    updateEnterDisplay();
    // Force focus on the hidden input to bring up the keyboard
    letterInput.focus();
}

// Update the enter popup display
function updateEnterDisplay() {
    currentDieNum.textContent = currentEnterIndex + 1;

    // Update preview grid
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

    // Auto-convert Q to Qu
    let letter;
    if (value[0] === 'Q') {
        letter = 'Qu';
    } else if (/^[A-Z]$/.test(value[0])) {
        letter = value[0];
    } else {
        letterInput.value = '';
        return;
    }

    // Set the letter on the board
    board[currentEnterIndex] = letter;

    // Update main board display
    const face = document.getElementById(`face-${currentEnterIndex}`);
    setDieLetter(face, letter, true);
    face.classList.add('visible');

    // Move to next die
    currentEnterIndex++;
    letterInput.value = '';

    if (currentEnterIndex >= 16) {
        // Board complete
        hidePopups();
        updateSolveButton();
        clearWords();
    } else {
        updateEnterDisplay();
        // Keep focus on hidden input for smooth progress
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
}

// Solve the board using DFS + backtracking
function solveBoard() {
    if (!dictionary || board.some(cell => cell === null)) return;

    clearWordHighlight();
    const foundWords = new Map(); // word -> path
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    // Convert board to 2D grid
    const grid = [];
    for (let i = 0; i < 4; i++) {
        grid.push(board.slice(i * 4, (i + 1) * 4));
    }

    // DFS from each cell
    function dfs(row, col, node, path, visited, positions) {
        if (row < 0 || row >= 4 || col < 0 || col >= 4) return;
        if (visited.has(`${row},${col}`)) return;

        let letter = grid[row][col];
        const lookupLetters = letter === 'Qu' ? ['Q', 'U'] : [letter];

        // Traverse the trie
        let currentNode = node;
        for (const l of lookupLetters) {
            if (!currentNode[l]) return;
            currentNode = currentNode[l];
        }

        const newPath = path + letter;
        const newPositions = [...positions, { row, col }];

        // Check if we found a word (minimum 3 letters)
        if (currentNode['$'] && newPath.length >= 3) {
            // Convert Qu to QU for storage
            const wordKey = newPath.replace(/Qu/g, 'QU');
            if (!foundWords.has(wordKey)) {
                foundWords.set(wordKey, newPositions);
            }
        }

        // Continue searching
        visited.add(`${row},${col}`);

        for (const [dr, dc] of directions) {
            dfs(row + dr, col + dc, currentNode, newPath, visited, newPositions);
        }

        visited.delete(`${row},${col}`);
    }

    // Start DFS from each cell
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            dfs(row, col, dictionary, '', new Set(), []);
        }
    }

    // Convert to array with paths
    foundWordsData = Array.from(foundWords.entries()).map(([word, path]) => ({
        word,
        path,
        points: calculatePoints(word)
    }));

    // Display results
    displayWords(foundWordsData);
}

// Calculate points for a word
function calculatePoints(word) {
    const length = word.length;
    if (length <= 4) return 1;
    return length - 3;
}

// Display found words
function displayWords(wordsData) {
    wordsList.innerHTML = '';

    // Check if no words found
    if (wordsData.length === 0) {
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

    let total = 0;

    sortedWords.forEach(({ word, points, path }) => {
        total += points;

        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
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

    wordCount.textContent = sortedWords.length;
    totalPoints.textContent = total;
}

// Select a word and show its path
function selectWord(word, path) {
    // Collapse words container if expanded
    if (wordsExpanded) {
        toggleWordsExpanded();
    }

    // Toggle selection
    if (selectedWord === word) {
        clearWordHighlight();
        return;
    }

    selectedWord = word;

    // Update word item styling
    document.querySelectorAll('.word-item').forEach(item => {
        item.classList.remove('selected');
        if (item.querySelector('.word').textContent === word) {
            item.classList.add('selected');
        }
    });

    // Clear previous highlights
    clearDiceHighlights();

    // Highlight dice (no numbers)
    path.forEach((pos) => {
        const dieIndex = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${dieIndex}`);
        face.classList.add('highlighted');
    });

    // Draw path arrows (no starting dot)
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
    // Remove all lines and circles except the marker definition
    const elements = pathOverlay.querySelectorAll('line, circle, path');
    elements.forEach(el => el.remove());
}

// Draw path on the board (arrows only, no starting dot)
function drawPath(positions) {
    clearPathOverlay();

    if (positions.length < 2) return;

    const overlayRect = pathOverlay.getBoundingClientRect();

    // Calculate die centers
    const dieCenters = positions.map(pos => {
        const dieIndex = pos.row * 4 + pos.col;
        const face = document.getElementById(`face-${dieIndex}`);
        const faceRect = face.getBoundingClientRect();

        return {
            x: faceRect.left + faceRect.width / 2 - overlayRect.left,
            y: faceRect.top + faceRect.height / 2 - overlayRect.top
        };
    });

    // Draw lines between consecutive dice
    for (let i = 0; i < dieCenters.length - 1; i++) {
        const start = dieCenters[i];
        const end = dieCenters[i + 1];

        // Calculate direction for offset
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        // Offset from center to edge of die
        const offset = 18;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', start.x + unitX * offset);
        line.setAttribute('y1', start.y + unitY * offset);
        line.setAttribute('x2', end.x - unitX * offset);
        line.setAttribute('y2', end.y - unitY * offset);

        // Add arrowhead to last segment only
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