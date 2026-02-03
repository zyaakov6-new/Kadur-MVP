import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LoadingState } from './LoadingState';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, BORDER_RADIUS, FONTS, SPACING } from '../../constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'glass';
    disabled?: boolean;
    icon?: React.ReactNode;
    loading?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PremiumButton: React.FC<PremiumButtonProps> = ({
    title,
    onPress,
    style,
    textStyle,
    variant = 'primary',
    disabled = false,
    icon,
    loading = false
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    const getColors = () => {
        if (disabled) return ['#4B5563', '#374151'];
        switch (variant) {
            case 'primary':
                return [COLORS.turfGreen, COLORS.turfGreen];
            case 'secondary':
                return [COLORS.accentOrange, COLORS.accentOrange];
            case 'glass':
                return ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.06)'];
            default:
                return [COLORS.turfGreen, COLORS.turfGreen];
        }
    };

    return (
        <AnimatedTouchable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[styles.container, style, animatedStyle]}
        >
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: (getColors() as string[])[0] }
                ]}
            />
            {loading ? (
                <View style={{ width: 24, height: 24 }}>
                    <LoadingState fullScreen={false} size={20} />
                </View>
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, textStyle, icon ? { marginLeft: 8 } : {}]}>{title}</Text>
                </>
            )}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.heading,
    },
});
