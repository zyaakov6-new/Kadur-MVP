import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
}

// Create client with error handling
let supabaseClient;
try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
        global: {
            fetch: async (url, options) => {
                try {
                    const response = await fetch(url, options);
                    return response;
                } catch (error: any) {
                    console.error('--- Supabase Network Error ---');
                    console.error('URL:', url);
                    console.error('Error Name:', error.name);
                    console.error('Error Message:', error.message);
                    if (error.message.includes('Network request failed')) {
                        console.error('TIP: Check if your public network/Wi-Fi is blocking the connection or requires a login (captive portal).');
                    }
                    console.error('-----------------------------');
                    throw error;
                }
            }
        }
    });
} catch (error) {
    console.error('Failed to create Supabase client:', error);

    // Create a dummy client to prevent crashes
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder', {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
}

export const supabase = supabaseClient;
