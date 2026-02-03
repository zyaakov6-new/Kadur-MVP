import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function DebugNetworkScreen() {
    const router = useRouter();
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const testGoogle = async () => {
        setLoading(true);
        addLog('Testing Google connectivity...');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://www.google.com', {
                method: 'HEAD',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            addLog(`Google Status: ${response.status}`);
            addLog('Google connectivity OK');
        } catch (e: any) {
            addLog(`Google Error: ${e.message}`);
            addLog(`Full Error: ${JSON.stringify(e)}`);
        } finally {
            setLoading(false);
        }
    };

    const testSupabase = async () => {
        setLoading(true);
        addLog('Testing Supabase client...');
        try {
            // Create a promise that rejects after 5 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Supabase client timeout (5s)')), 5000)
            );

            const queryPromise = supabase.from('games').select('count').limit(1).single();

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

            if (error) {
                addLog(`Supabase Error: ${error.message}`);
                addLog(`Details: ${JSON.stringify(error)}`);
            } else {
                addLog('Supabase connectivity OK');
                addLog(`Data received: ${JSON.stringify(data)}`);
            }
        } catch (e: any) {
            addLog(`Supabase Exception: ${e.message}`);
            addLog(`Full Exception: ${JSON.stringify(e)}`);
        } finally {
            setLoading(false);
        }
    };

    const testSupabaseRaw = async () => {
        setLoading(true);
        addLog('Testing Supabase Raw Fetch...');
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://tfmekqkjbkmlyfjznmak.supabase.co/rest/v1/', {
                method: 'GET',
                headers: {
                    'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            addLog(`Supabase Raw Status: ${response.status}`);
            const text = await response.text();
            addLog(`Response: ${text.substring(0, 100)}...`);
        } catch (e: any) {
            addLog(`Supabase Raw Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Network Debug</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={testGoogle} disabled={loading}>
                        <Text style={styles.buttonText}>Test Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.supabaseButton]} onPress={testSupabase} disabled={loading}>
                        <Text style={styles.buttonText}>Test Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.supabaseButton, { backgroundColor: '#8b5cf6' }]} onPress={testSupabaseRaw} disabled={loading}>
                        <Text style={styles.buttonText}>Test Raw</Text>
                    </TouchableOpacity>
                </View>

                {loading && <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 20 }} />}

                <ScrollView style={styles.logsContainer}>
                    {logs.map((log, index) => (
                        <Text key={index} style={styles.logText}>{log}</Text>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 8,
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    supabaseButton: {
        backgroundColor: '#10b981',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    logsContainer: {
        flex: 1,
        backgroundColor: '#000',
        borderRadius: 8,
        padding: 12,
    },
    logText: {
        color: '#0f0',
        fontFamily: 'monospace',
        marginBottom: 4,
        fontSize: 12,
    },
});
