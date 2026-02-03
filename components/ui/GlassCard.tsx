import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    intensity?: number;
    noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, contentStyle, intensity = 20, noPadding = false }) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 20, 15, 0.9)' }]} />
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
        borderWidth: 0,
        borderColor: 'transparent',
        ...SHADOWS.glass,
    },
    content: {
        padding: 16,
    },
});

