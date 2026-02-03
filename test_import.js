try {
    const fs = require('fs');
    const chats = fs.readFileSync('c:/Users/Ziv Yaakov/projects/Football/kadur/app/(tabs)/chats.tsx', 'utf8');
    const chat = fs.readFileSync('c:/Users/Ziv Yaakov/projects/Football/kadur/app/game/[id]/chat.tsx', 'utf8');
    console.log('Files read successfully');
} catch (e) {
    console.error('Error reading files:', e);
}
