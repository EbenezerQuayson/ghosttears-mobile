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

    // We add lockedWords parameter to check for repeat penalties
    checkStatus(fragment, lockedWords = []) {
        const cleanFrag = Trie.normalize(fragment);
        let node = this.root;

        for (let i = 0; i < cleanFrag.length; i++) {
            const char = cleanFrag[i];
            if (!node.children[char]) {
                return 'INVALID'; // A bluff or typo
            }
            node = node.children[char];
        }

        // In Ghost, completing a word generally must be 4 or more letters to count as a loss.
        // Also, must check if it's already in the lockedWords (it shouldn't be possible because
        // it was already completed, but just in case, or if someone types a prefix of it)
        // Actually, in standard Ghost you just lose if you complete *any* valid word. 
        // If the word was already played, playing it again is a loss anyway because it's a word.
        // BUT we must also ensure that we reject *continuing* a word that can only become 
        // a locked word (if there are no other valid branches). We'll handle that via INVALID 
        // if the bot/player tries to spell something already locked.
        // To keep it simple: if it's a word, it's a word. They lose.
        // However, if the active lockedWords includes this exact word, we still count it as COMPLETE_WORD
        // because spelling a word is spelling a word.
        if (node.isEndOfWord && cleanFrag.length >= 4) {
            // Is it exactly a word that was already completed previously?
            // Generally, in Ghost, typing a word loses the round. 
            // If a word is already "locked" (played previously), typing it again is just as bad.
            return 'COMPLETE_WORD';
        }

        // Check if the current prefix *only* leads to locked words.
        // E.g., if 'CHEETAH' is locked and there's no other animal starting with 'CHEET', 
        // it should be an INVALID path. But for Phase 1.5 MVP, simply avoiding the exact 
        // word is enough for the players; if they spell it, they lose.
        // The Bot shouldn't pick locked words.

        return 'VALID_PREFIX';
    }

    getNoviceMove(fragment, lockedWords = []) {
        const cleanFrag = Trie.normalize(fragment);
        let node = this.root;

        if (!cleanFrag) {
            // Pick a common starting letter for this category's children
            const possibleLetters = Object.keys(node.children);
            if (possibleLetters.length === 0) return null;
            return possibleLetters[Math.floor(Math.random() * possibleLetters.length)];
        }

        for (let i = 0; i < cleanFrag.length; i++) {
            const char = cleanFrag[i];
            if (!node.children[char]) return null;
            node = node.children[char];
        }

        // To prevent bot from spelling a locked word to lose, we should ideally not pick paths 
        // that immediately end words, but NoviceBot is dumb. We just pick random valid next character.
        let possibleLetters = Object.keys(node.children);

        // Filter out letters that instantly complete a word if there are safe alternatives
        const safeLetters = possibleLetters.filter(char => {
            const nextNode = node.children[char];
            return !(nextNode.isEndOfWord && (cleanFrag.length + 1) >= 4);
        });

        if (safeLetters.length > 0) {
            possibleLetters = safeLetters;
        }

        if (possibleLetters.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * possibleLetters.length);
        return possibleLetters[randomIndex];
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

    getNoviceMove(category, fragment, lockedWords = []) {
        if (!this.tries[category]) return null;
        return this.tries[category].getNoviceMove(fragment, lockedWords);
    }
}

const engineInstance = new WordEngine();

export const initializeDictionary = () => {
    engineInstance.initialize();
    return engineInstance;
};

export default engineInstance;
