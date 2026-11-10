class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}

export class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    // Helper to remove punctuation or spaces from fragments
    static normalize(str) {
        return str.toUpperCase().replace(/[^A-Z]/g, '');
    }

    insert(word) {
        let node = this.root;
        const cleanWord = Trie.normalize(word);

        for (let i = 0; i < cleanWord.length; i++) {
            const char = cleanWord[i];
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }

    hasAvailableWord(node, currentPrefix, lockedWordsSet) {
        if (node.isEndOfWord && currentPrefix.length >= 4) {
            if (!lockedWordsSet.has(currentPrefix)) {
                return true;
            }
        }
        for (const [char, childNode] of Object.entries(node.children)) {
            if (this.hasAvailableWord(childNode, currentPrefix + char, lockedWordsSet)) {
                return true;
            }
        }
        return false;
    }

    checkStatus(fragment, lockedWords = []) {
        const cleanFrag = Trie.normalize(fragment);
        const lockedWordsSet = new Set(lockedWords.map(w => Trie.normalize(w)));
        let node = this.root;

        for (let i = 0; i < cleanFrag.length; i++) {
            const char = cleanFrag[i];
            if (!node.children[char]) {
                return 'INVALID'; // A bluff or typo
            }
            node = node.children[char];
        }

        if (node.isEndOfWord && cleanFrag.length >= 4) {
            if (!lockedWordsSet.has(cleanFrag)) {
                return 'COMPLETE_WORD';
            }
        }

        if (this.hasAvailableWord(node, cleanFrag, lockedWordsSet)) {
            return 'VALID_PREFIX';
        } else {
            return 'INVALID';
        }
    }

    // AI Logic
    getAIMove(fragment, lockedWords = [], difficulty = 'intermediate', activePlayersCount = 2) {
        const cleanFrag = Trie.normalize(fragment);
        const lockedWordsSet = new Set(lockedWords.map(w => Trie.normalize(w)));
        let node = this.root;

        if (!cleanFrag) {
            // First move: pick a common starting letter that doesn't immediately lead to dead ends
            const possibleLetters = Object.keys(node.children).filter(char => 
                this.hasAvailableWord(node.children[char], char, lockedWordsSet)
            );
            if (possibleLetters.length === 0) return null;
            return possibleLetters[Math.floor(Math.random() * possibleLetters.length)];
        }

        for (let i = 0; i < cleanFrag.length; i++) {
            const char = cleanFrag[i];
            if (!node.children[char]) return null;
            node = node.children[char];
        }

        let possibleLetters = Object.keys(node.children);
        if (possibleLetters.length === 0) return null;

        if (difficulty === 'novice') {
            // Dumb AI: Just picks a random valid next letter. It will happily complete words!
            const randomIndex = Math.floor(Math.random() * possibleLetters.length);
            return possibleLetters[randomIndex];
        }

        // Filter out letters that lead to dead ends (only locked words left)
        const validLetters = possibleLetters.filter(char => {
            return this.hasAvailableWord(node.children[char], cleanFrag + char, lockedWordsSet);
        });

        if (difficulty === 'intermediate') {
            // Intermediate AI: Tries not to immediately complete a word, but doesn't look far ahead
            const safeLetters = validLetters.filter(char => {
                const nextNode = node.children[char];
                const nextPrefix = cleanFrag + char;
                return !(nextNode.isEndOfWord && nextPrefix.length >= 4 && !lockedWordsSet.has(nextPrefix));
            });

            const pool = safeLetters.length > 0 ? safeLetters : validLetters;
            if (pool.length === 0) return null;
            return pool[Math.floor(Math.random() * pool.length)];
        }

        if (difficulty === 'expert') {
            // Expert AI: Minimax to find a forced win or delay loss
            // We use a depth limit of 6 to keep it lightning fast even on large dictionaries
            const evaluateNode = (n, currentDepth, maxDepth, prefix) => {
                // If it's a word, the player whose turn it is loses (-1)
                if (n.isEndOfWord && prefix.length >= 4 && !lockedWordsSet.has(prefix)) {
                    return -1;
                }
                if (currentDepth >= maxDepth) {
                    return 0; // Unknown evaluation (tie state)
                }

                const children = Object.keys(n.children).filter(c => 
                    this.hasAvailableWord(n.children[c], prefix + c, lockedWordsSet)
                );
                
                if (children.length === 0) return -1; // Dead end, current player loses (bluff caught essentially)

                let bestVal = -Infinity;
                for (let c of children) {
                    // For multiplayer Ghost (N players), standard minimax is complex. 
                    // But generally, picking a branch that leads to a guaranteed loss for the NEXT player is good.
                    // We'll treat it as a 2-player zero-sum game for simplicity even if there are >2 players.
                    // -evaluateNode gives the value for the *current* player based on the *next* player's position.
                    const val = -evaluateNode(n.children[c], currentDepth + 1, maxDepth, prefix + c);
                    if (val > bestVal) bestVal = val;
                }
                return bestVal;
            };

            let bestScore = -Infinity;
            let bestMoves = [];

            for (let char of validLetters) {
                const nextNode = node.children[char];
                const nextPrefix = cleanFrag + char;
                
                // If this immediately completes a word, it's a guaranteed loss (-1)
                let score;
                if (nextNode.isEndOfWord && nextPrefix.length >= 4 && !lockedWordsSet.has(nextPrefix)) {
                    score = -1;
                } else {
                    score = -evaluateNode(nextNode, 1, 6, nextPrefix);
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [char];
                } else if (score === bestScore) {
                    bestMoves.push(char);
                }
            }

            if (bestMoves.length === 0) return validLetters[0] || possibleLetters[0] || null;
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }

        return null;
    }
}

// Manage multiple dictionaries
class WordEngine {
    constructor() {
        this.tries = {
            animals: new Trie(),
            countries: new Trie(),
            fruits: new Trie(),
            vegetables: new Trie(),
        };
    }

    initialize() {
        console.log('Initializing Category Dictionaries...');
        const startTime = Date.now();

        try {
            const animals = require('../assets/dictionaries/animals.json');
            const countries = require('../assets/dictionaries/countries.json');
            const fruits = require('../assets/dictionaries/fruits.json');
            const vegetables = require('../assets/dictionaries/vegetables.json');

            animals.forEach(w => this.tries.animals.insert(w));
            countries.forEach(w => this.tries.countries.insert(w));
            fruits.forEach(w => this.tries.fruits.insert(w));
            vegetables.forEach(w => this.tries.vegetables.insert(w));

            console.log(`Dictionaries initialized in ${Date.now() - startTime}ms.`);
        } catch (e) {
            console.error('Failed to load dictionary JSONs. Make sure they exist locally.', e);
        }
    }

    checkStatus(category, fragment, lockedWords = []) {
        if (!this.tries[category]) return 'INVALID';
        return this.tries[category].checkStatus(fragment, lockedWords);
    }

    getAIMove(category, fragment, lockedWords = [], difficulty = 'intermediate', activePlayersCount = 2) {
        if (!this.tries[category]) return null;
        return this.tries[category].getAIMove(fragment, lockedWords, difficulty, activePlayersCount);
    }
}

const engineInstance = new WordEngine();

export const initializeDictionary = () => {
    engineInstance.initialize();
    return engineInstance;
};

export default engineInstance;
