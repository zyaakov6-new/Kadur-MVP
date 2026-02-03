import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { COLORS, FONTS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

export const OfflineBanner = () => {
    const isOffline = useOfflineStatus();
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-100);
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    useEffect(() => {
        if (isOffline) {
            translateY.value = withSpring(0, { damping: 15 });
        } else {
            translateY.value = withTiming(-100, { duration: 300 });
        }
    }, [isOffline]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    return (
        <Animated.View style={[styles.container, { paddingTop: insets.top }, animatedStyle]}>
            <View style={[styles.content, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="cloud-offline" size={20} color="white" />
                <Text style={styles.text}>{t('common.no_internet', 'No Internet Connection')}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.accentOrange, // Using orange as warning color
        zIndex: 9999,
        paddingBottom: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    text: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
