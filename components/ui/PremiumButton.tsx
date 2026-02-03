import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, BORDER_RADIUS, FONTS, SPACING, SHADOWS } from '../../constants/theme';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'outline';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const PremiumButton: React.FC<PremiumButtonProps> = ({
    title,
    onPress,
    style,
    textStyle,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = true,
}) => {
    const scale = useSharedValue(1);
    const pressed = useSharedValue(0);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedInnerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pressed.value, [0, 1], [1, 0.85]),
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
        pressed.value = withTiming(1, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        pressed.value = withTiming(0, { duration: 150 });
    };

    const handlePress = () => {
        if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
        }
    };

    const getGradientColors = (): [string, string, string] => {
        if (disabled) return ['#3A4540', '#2D3633', '#252D2A'];
        switch (variant) {
            case 'primary':
                return [COLORS.turfGreenLight, COLORS.turfGreen, COLORS.turfGreenDark];
            case 'secondary':
                return [COLORS.accentOrangeLight, COLORS.accentOrange, '#E85A2D'];
            case 'danger':
                return ['#EF5350', '#E53935', '#C62828'];
            case 'glass':
                return ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)'];
            case 'outline':
                return ['transparent', 'transparent', 'transparent'];
            default:
                return [COLORS.turfGreenLight, COLORS.turfGreen, COLORS.turfGreenDark];
        }
    };

    const getBorderStyle = () => {
        if (variant === 'outline') {
            return {
                borderWidth: 1.5,
                borderColor: disabled ? COLORS.textTertiary : COLORS.turfGreen,
            };
        }
        if (variant === 'glass') {
            return {
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.15)',
            };
        }
        return {};
    };

    const getShadowStyle = () => {
        if (disabled || variant === 'outline' || variant === 'glass') return {};
        return {
            ...SHADOWS.button,
            shadowColor: variant === 'secondary' ? COLORS.accentOrange :
                        variant === 'danger' ? '#E53935' : COLORS.turfGreen,
        };
    };

    const getHeight = () => {
        switch (size) {
            case 'small': return 44;
            case 'large': return 64;
            default: return 54;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small': return 14;
            case 'large': return 18;
            default: return 16;
        }
    };

    const getTextColor = () => {
        if (disabled) return COLORS.textTertiary;
        if (variant === 'outline') return COLORS.turfGreen;
        return '#FFFFFF';
    };

    const renderContent = () => {
        if (loading) {
            return (
                <ActivityIndicator
                    size="small"
                    color={variant === 'outline' ? COLORS.turfGreen : '#FFFFFF'}
                />
            );
        }

        return (
            <View style={[styles.contentContainer, iconPosition === 'right' && styles.contentReverse]}>
                {icon && <View style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}>{icon}</View>}
                <Text
                    style={[
                        styles.text,
                        { fontSize: getFontSize(), color: getTextColor() },
                        textStyle,
                    ]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
            </View>
        );
    };

    return (
        <AnimatedTouchable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={1}
            style={[
                styles.container,
                { height: getHeight() },
                getBorderStyle(),
                getShadowStyle(),
                !fullWidth && styles.autoWidth,
                style,
                animatedContainerStyle,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, animatedInnerStyle]}>
                <LinearGradient
                    colors={getGradientColors()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                {/* Subtle top shine effect */}
                {variant !== 'outline' && variant !== 'glass' && (
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)', 'transparent']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.5 }}
                        style={[StyleSheet.absoluteFill, { opacity: disabled ? 0 : 1 }]}
                    />
                )}
            </Animated.View>
            {renderContent()}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    autoWidth: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.l,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.m,
    },
    contentReverse: {
        flexDirection: 'row-reverse',
    },
    iconLeft: {
        marginRight: SPACING.s,
    },
    iconRight: {
        marginLeft: SPACING.s,
    },
    text: {
        fontWeight: '700',
        fontFamily: FONTS.heading,
        letterSpacing: 0.3,
    },
});
