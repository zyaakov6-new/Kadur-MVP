const fs = require('fs');

const he = JSON.parse(fs.readFileSync('c:/Users/Ziv Yaakov/projects/Football/kadur/i18n/he.json', 'utf8'));
const files = [
    'c:/Users/Ziv Yaakov/projects/Football/kadur/app/(tabs)/chats.tsx',
    'c:/Users/Ziv Yaakov/projects/Football/kadur/app/game/[id]/chat.tsx'
];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/t\(['"](.*?)['"]\)/g);
    if (matches) {
        matches.forEach(match => {
            const key = match.slice(3, -2);
            const keys = key.split('.');
            let obj = he;
            keys.forEach(k => {
                if (obj) obj = obj[k];
            });
            if (!obj) {
                console.error(`ERROR: Key "${key}" not found in he.json (used in ${file})`);
            } else {
                console.log(`OK: Key "${key}" found.`);
            }
        });
    }
});
