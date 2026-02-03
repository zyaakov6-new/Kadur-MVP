import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
    const router = useRouter();
    const { session, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (session) {
            router.replace('/(tabs)');
        } else {
            router.replace('/(auth)/login');
        }
    }, [loading, session, router]);

    return (
        <View style={{ flex: 1, backgroundColor: '#050B08' }}>
            <LoadingState />
        </View>
    );
}
