const fs = require('fs');
const path = require('path');
const https = require('https');

const DICTIONARY_URL = 'https://raw.githubusercontent.com/jessicatysu/scrabble/master/TWL06.txt';
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'dictionary.json');

// Ensure the standard scalable structure exists
const dirs = [
    path.join(__dirname, '..', 'src', 'engine'),
    path.join(__dirname, '..', 'src', 'components'),
    path.join(__dirname, '..', 'src', 'screens'),
    ASSETS_DIR,
];

dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

console.log('Downloading SOWPODS dictionary...');

https.get(DICTIONARY_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        // Split by newline, trim, convert to uppercase, keep only alphabet characters, filter empty strings
        // Also filter words less than 2 characters since a 1-character word doesn't add much to bluffing, 
        // but standard ghost generally accepts 3+ character words as losing conditions. 
        // We'll keep them all and let the game logic handle length requirement (usually >= 3 or 4).
        const words = data
            .split(/\r?\n/)
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length > 0 && /^[A-Z]+$/.test(word));

        console.log(`Successfully parsed ${words.length} words.`);

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(words));
        console.log(`Saved dictionary JSON to ${OUTPUT_FILE}`);
    });
}).on('error', (err) => {
    console.error('Error downloading dictionary:', err.message);
});
