const fs = require('fs');
const path = require('path');
const https = require('https');

const CATEGORIES = {
    animals: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/animals/common.json',
    countries: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/geography/countries.json',
    fruits: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/foods/fruits.json',
    vegetables: 'https://raw.githubusercontent.com/dariusk/corpora/master/data/foods/vegetables.json'
};

const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets', 'dictionaries');

if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const downloadCategory = (name, url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // corpora sets the array at different keys depending on the file
                    let wordsArray = [];
                    if (parsed.animals) wordsArray = parsed.animals;
                    else if (parsed.countries) wordsArray = parsed.countries;
                    else if (parsed.fruits) wordsArray = parsed.fruits;
                    else if (parsed.vegetables) wordsArray = parsed.vegetables;
                    else wordsArray = parsed.data || [];

                    // Clean up words: uppercase, remove spaces (or handle spaces by omitting them), filter non-alpha
                    const cleanWords = wordsArray
                        .map(w => w.toUpperCase().replace(/[^A-Z]/g, ''))
                        .filter(w => w.length >= 4);

                    // Unique
                    const uniqueWords = [...new Set(cleanWords)];

                    const outFile = path.join(ASSETS_DIR, `${name}.json`);
                    fs.writeFileSync(outFile, JSON.stringify(uniqueWords));
                    console.log(`Saved ${uniqueWords.length} words to ${name}.json`);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

async function main() {
    for (const [name, url] of Object.entries(CATEGORIES)) {
        console.log(`Downloading ${name}...`);
        await downloadCategory(name, url);
    }
}

main().catch(console.error);
