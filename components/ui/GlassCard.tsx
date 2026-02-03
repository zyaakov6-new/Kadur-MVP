import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    intensity?: number;
    noPadding?: boolean;
    variant?: 'default' | 'elevated' | 'subtle' | 'outlined';
    glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    contentStyle,
    intensity = 25,
    noPadding = false,
    variant = 'default',
    glowColor
}) => {
    const getBackgroundColors = () => {
        switch (variant) {
            case 'elevated':
                return ['rgba(255, 255, 255, 0.98)', 'rgba(249, 250, 251, 0.98)'];
            case 'subtle':
                return ['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.92)'];
            case 'outlined':
                return ['rgba(255, 255, 255, 0.75)', 'rgba(245, 247, 250, 0.8)'];
            default:
                return ['rgba(255, 255, 255, 0.94)', 'rgba(249, 250, 251, 0.98)'];
        }
    };

    const getBorderStyle = () => {
        switch (variant) {
            case 'elevated':
                return { borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.08)' };
            case 'subtle':
                return { borderWidth: 0.5, borderColor: 'rgba(15, 23, 42, 0.06)' };
            case 'outlined':
                return { borderWidth: 1.5, borderColor: 'rgba(15, 23, 42, 0.12)' };
            default:
                return { borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.08)' };
        }
    };

    const getShadowStyle = () => {
        if (glowColor) {
            return {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 10,
            };
        }
        switch (variant) {
            case 'elevated':
                return SHADOWS.glass;
            case 'subtle':
                return SHADOWS.softGlow;
            default:
                return SHADOWS.card;
        }
    };

    return (
        <View style={[styles.container, getBorderStyle(), getShadowStyle(), style]}>
            <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={getBackgroundColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Subtle top highlight for depth */}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.6)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
                style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS.l }]}
            />
            <View style={[styles.content, noPadding && { padding: 0 }, contentStyle]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.l,
        overflow: 'hidden',
    },
    content: {
        padding: SPACING.m,
    },
});
