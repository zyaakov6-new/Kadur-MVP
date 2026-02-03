import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<Notifications.Subscription>(null);
    const responseListener = useRef<Notifications.Subscription>(null);

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

                // UUID regex to validate project ID and prevent crash with placeholders
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                const isValidId = projectId && (uuidRegex.test(projectId) || projectId.length > 20);

                if (isValidId) {
                    token = (await Notifications.getExpoPushTokenAsync({
                        projectId,
                    })).data;
                    console.log('Push Token:', token);
                } else {
                    console.log('Skipping push token: No valid projectId found');
                }
            } catch (e) {
                console.error('Error getting push token:', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    const saveTokenToProfile = async (token: string, userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ push_token: token })
                .eq('id', userId);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving push token to profile:', error);
        }
    };

    return {
        expoPushToken,
        notification,
        registerForPushNotificationsAsync,
        saveTokenToProfile,
        notificationListener,
        responseListener,
    };
};
