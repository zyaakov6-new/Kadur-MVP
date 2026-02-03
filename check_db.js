const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkColumn() {
    console.log('Checking for address column...');
    const { data, error } = await supabase
        .from('games')
        .select('address')
        .limit(1);

    if (error) {
        console.error('Error selecting address:', error.message);
    } else {
        console.log('Success: Address column exists.');
    }
}

checkColumn();
