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
                return ['rgba(20, 35, 28, 0.95)', 'rgba(15, 28, 22, 0.98)'];
            case 'subtle':
                return ['rgba(15, 25, 20, 0.85)', 'rgba(12, 22, 18, 0.9)'];
            case 'outlined':
                return ['rgba(10, 18, 14, 0.6)', 'rgba(8, 15, 12, 0.7)'];
            default:
                return ['rgba(16, 28, 22, 0.92)', 'rgba(12, 22, 17, 0.95)'];
        }
    };

    const getBorderStyle = () => {
        switch (variant) {
            case 'elevated':
                return { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' };
            case 'subtle':
                return { borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.06)' };
            case 'outlined':
                return { borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.15)' };
            default:
                return { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' };
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
            <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={getBackgroundColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Subtle top highlight for depth */}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
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
