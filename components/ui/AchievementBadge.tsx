import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withDelay } from 'react-native-reanimated';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../../constants/theme';
import { BlurView } from 'expo-blur';

interface AchievementBadgeProps {
    title: string;
    description: string;
    icon: any; // Ionicons name
    locked: boolean;
    xp: number;
    index?: number;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ title, description, icon, locked, xp, index = 0 }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(index * 100, withSpring(1));
        opacity.value = withDelay(index * 100, withSpring(1));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={[styles.badgeContainer, locked && styles.lockedBadge]}>
                <View
                    style={[styles.gradient, { backgroundColor: locked ? 'rgba(255,255,255,0.05)' : COLORS.turfGreen }]}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={locked ? "lock-closed" : icon}
                            size={32}
                            color={locked ? "rgba(255,255,255,0.3)" : "#FFD700"}
                        />
                    </View>
                    <View style={styles.xpBadge}>
                        <Text style={styles.xpText}>{xp} XP</Text>
                    </View>
                </View>
            </View>
            <Text style={[styles.title, locked && styles.lockedText]}>{title}</Text>
            {/* <Text style={styles.description} numberOfLines={2}>{description}</Text> */}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 100,
        marginRight: SPACING.m,
    },
    badgeContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: SPACING.s,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.5)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    lockedBadge: {
        borderColor: 'rgba(255,255,255,0.1)',
        shadowOpacity: 0,
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 4,
    },
    xpBadge: {
        position: 'absolute',
        bottom: 8,
        backgroundColor: 'transparent',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    xpText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    title: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: FONTS.body,
    },
    lockedText: {
        color: COLORS.textSecondary,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
});
