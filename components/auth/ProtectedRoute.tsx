import React, { useEffect } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const isDebug = segments[0] === 'debug-network';
        const isProfileSetup = segments[0] === '(auth)' && segments[1] === 'profile_setup';

        if (isDebug) return;
        if (isProfileSetup) return; // Allow profile setup for authenticated users

        if (!session && !inAuthGroup) {
            // Redirect to login if not authenticated and not in auth group
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup && !isProfileSetup) {
            // Authenticated users in (auth) should stay there 
            // until the page itself decides to redirect (e.g. after profile check)
            return;
        }
    }, [session, loading, segments]);

    return <>{children}</>;
}
