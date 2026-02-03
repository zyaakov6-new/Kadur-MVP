import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug logging
console.log('Supabase URL configured:', supabaseUrl ? 'Yes' : 'No');
console.log('Supabase Key configured:', supabaseAnonKey ? 'Yes' : 'No');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    console.error('Make sure you have:');
    console.error('  EXPO_PUBLIC_SUPABASE_URL=your_url');
    console.error('  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
}

// Custom fetch with retry logic
const fetchWithRetry = async (url: string, options: RequestInit | undefined, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            console.error(`Fetch attempt ${i + 1}/${retries} failed:`, error.message);

            if (i === retries - 1) {
                // Last attempt failed
                console.error('--- Supabase Network Error ---');
                console.error('URL:', url);
                console.error('Error:', error.message);
                console.error('Possible causes:');
                console.error('  1. No internet connection');
                console.error('  2. Supabase service is down');
                console.error('  3. Firewall blocking the connection');
                console.error('  4. VPN or proxy interference');
                console.error('-----------------------------');
                throw error;
            }

            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    throw new Error('All retry attempts failed');
};

// Create client
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
            fetch: fetchWithRetry,
        },
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

// Helper to test connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
};
