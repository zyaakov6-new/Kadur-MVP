import fs from 'fs';
import path from 'path';

const files = [
    'c:/Users/Ziv Yaakov/projects/Football/kadur/app/(tabs)/chats.tsx',
    'c:/Users/Ziv Yaakov/projects/Football/kadur/app/game/[id]/chat.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Fix redundant TouchableOpacity in chats.tsx
        if (file.includes('chats.tsx')) {
            content = content.replace(
                /<TouchableOpacity\s+onPress=\{.*?\}\s+onLongPress=\{.*?\}\s+>\s+<TouchableOpacity/g,
                '<TouchableOpacity'
            );
            // This is a bit risky with regex, better to use a specific replacement if I know the content
        }

        console.log(`Checked ${file}`);
    }
});
