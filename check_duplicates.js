const fs = require('fs');
const content = fs.readFileSync('c:/Users/Ziv Yaakov/projects/Football/kadur/i18n/he.json', 'utf8');

function findDuplicates(jsonStr) {
    const keys = [];
    const regex = /"(.+?)":/g;
    let match;
    while ((match = regex.exec(jsonStr)) !== null) {
        keys.push(match[1]);
    }
    const seen = new Set();
    const duplicates = [];
    keys.forEach(key => {
        if (seen.has(key)) {
            duplicates.push(key);
        }
        seen.add(key);
    });
    return duplicates;
}

const duplicates = findDuplicates(content);
if (duplicates.length > 0) {
    console.log('Duplicate keys found:', duplicates);
} else {
    console.log('No duplicate keys found.');
}
