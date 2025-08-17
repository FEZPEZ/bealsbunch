// Simulated file contents (in a real implementation, you'd fetch these)
const fileContents = {
    'arsenic.txt': "My dear Abby, I love you very much. You're the sweetest, most wonderful sister in the world. And I'm very sorry but you've got to die. Now don't be afraid. It's not going to hurt. Just a tiny pinprick. Mortimer, we've been poisoning lonely old men for years. It's one of our charities. We have twelve in the cellar now. That leaves very little room for the wine.",
    'charlie-brown.txt': "Good grief! I can't stand it! I just can't stand it! My stomach hurts. I'm not the kind of person who can take a lot of pressure. Why do we have to have all this rain? I'm tired of being wishy-washy! I'm gonna be strong and firm! I think I'm losing my mind. Sometimes I lie awake at night and I ask, Why me? And the voice says, Nothing personal, your name just happened to come up.",
    'earnest.txt': "I have always been of opinion that a man who desires to get married should know either everything or nothing. To lose one parent may be regarded as a misfortune; to lose both looks like carelessness. The truth is rarely pure and never simple. I never travel without my diary. One should always have something sensational to read in the train. All women become like their mothers. That is their tragedy. No man does. That's his.",
    'elf.txt': "The best way to spread Christmas cheer is singing loud for all to hear! I passed through the seven levels of the Candy Cane forest, through the sea of swirly twirly gum drops. I'm a cotton-headed ninny-muggins! Santa! Oh my God! Santa's coming! I know him! I know him! You sit on a throne of lies! You smell like beef and cheese! I think you're really beautiful and I feel really warm when I'm around you."
};

const speechBubble = document.getElementById('speechBubble');
const characterImg = document.getElementById('characterImg');
const lineBtn = document.getElementById('lineBtn');
const improviseBtn = document.getElementById('improviseBtn');

function getRandomWords(text, minWords = 5, maxWords = 20) {
    const words = text.split(/\s+/);
    const numWords = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const startIndex = Math.floor(Math.random() * Math.max(1, words.length - numWords));
    return words.slice(startIndex, startIndex + numWords).join(' ');
}

function generateMarkovText(texts, targetLength = 15) {
    // Simple bigram-based text generation
    const bigrams = {};
    const allTexts = texts.join(' ');
    const words = allTexts.split(/\s+/);

    // Build bigram frequency table
    for (let i = 0; i < words.length - 1; i++) {
        const current = words[i].toLowerCase();
        const next = words[i + 1];
        if (!bigrams[current]) {
            bigrams[current] = [];
        }
        bigrams[current].push(next);
    }

    // Find a starting word (one that starts with a capital letter)
    const startWords = words.filter(w => w[0] === w[0].toUpperCase() && bigrams[w.toLowerCase()]);
    let current = startWords[Math.floor(Math.random() * startWords.length)];
    let result = [current];

    // Generate text
    for (let i = 0; i < targetLength - 1; i++) {
        const currentLower = current.toLowerCase();
        if (!bigrams[currentLower] || bigrams[currentLower].length === 0) {
            // If we hit a dead end, pick a new random word
            const keys = Object.keys(bigrams);
            current = keys[Math.floor(Math.random() * keys.length)];
        } else {
            current = bigrams[currentLower][Math.floor(Math.random() * bigrams[currentLower].length)];
        }
        result.push(current);
    }

    // Ensure it ends with a complete word (remove partial punctuation)
    let finalText = result.join(' ');
    finalText = finalText.replace(/[,;:]$/, '.');
    if (!finalText.match(/[.!?]$/)) {
        finalText += '.';
    }

    return finalText;
}

lineBtn.addEventListener('click', () => {
    characterImg.src = 'assets/theater/confident.png';
    const fileNames = Object.keys(fileContents);
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    const randomText = getRandomWords(fileContents[randomFile]);
    speechBubble.innerHTML = randomText;
});

improviseBtn.addEventListener('click', () => {
    characterImg.src = 'assets/theater/panic.png';
    const allTexts = Object.values(fileContents);
    const improvisedText = generateMarkovText(allTexts, Math.floor(Math.random() * 11) + 10);
    speechBubble.innerHTML = improvisedText;
});