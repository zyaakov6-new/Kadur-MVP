import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import '../global.css';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LanguageProvider } from '../contexts/LanguageContext';
import { COLORS } from '../constants/theme';
import '../i18n'; // Initialize i18n
import { useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppContent() {
  const { session } = useAuth();
  const { registerForPushNotificationsAsync, saveTokenToProfile, notificationListener, responseListener } = usePushNotifications();

  useEffect(() => {
    if (session?.user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          saveTokenToProfile(token, session.user.id);
        }
      });

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Handle notification received while app is foregrounded
        console.log('Notification received:', notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        // Handle notification tap
        console.log('Notification tapped:', response);
      });

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [session]);

  return (
    <ProtectedRoute>
      <View style={{ flex: 1, backgroundColor: COLORS.darkBackground }}>
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.darkBackground },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="light" />
      </View>
    </ProtectedRoute>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
