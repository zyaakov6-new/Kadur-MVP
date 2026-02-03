import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    useSharedValue,
    withSpring,
    Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
    size?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    message,
    fullScreen = true,
    size = 60
}) => {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);
    const bounce = useSharedValue(0);

    const animationHeight = size * 1.6;
    const ballSize = size;
    const shadowWidth = size * 0.66;

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 2000, easing: Easing.linear }),
            -1,
            false
        );
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
        bounce.value = withRepeat(
            withSequence(
                withTiming(-(size * 0.33), { duration: 500, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })
            ),
            -1,
            true
        );
    }, [size]);

    const ballStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: bounce.value },
            { rotate: `${rotation.value}deg` },
            { scale: scale.value }
        ],
    }));

    const shadowStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: 1 - (bounce.value / -(size * 0.66)) }
        ],
        opacity: 0.3 + (bounce.value / -(size * 0.66)),
    }));

    const containerStyle = fullScreen ? styles.fullScreen : styles.inline;

    return (
        <View style={containerStyle}>
            <View style={[styles.animationContainer, { height: animationHeight }]}>
                {/* Shadow */}
                <Animated.View style={[styles.shadow, shadowStyle, { width: shadowWidth, bottom: size * 0.16 }]} />

                {/* Football Icon */}
                <Animated.View style={[styles.ballContainer, ballStyle, { width: ballSize, height: ballSize, borderRadius: ballSize / 2 }]}>
                    <LinearGradient
                        colors={[COLORS.turfGreen, COLORS.turfGreenDark]}
                        style={[styles.ballGradient, { borderRadius: ballSize / 2 }]}
                    >
                        <Ionicons name="football" size={size * 0.66} color="white" />
                    </LinearGradient>
                </Animated.View>
            </View>

            {message && (
                <Animated.Text style={styles.message}>
                    {message}
                </Animated.Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.darkBackground,
    },
    inline: {
        padding: SPACING.s,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ballContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: COLORS.turfGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    ballGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shadow: {
        position: 'absolute',
        height: 6,
        backgroundColor: 'black',
        borderRadius: 20,
    },
    message: {
        marginTop: SPACING.l,
        color: COLORS.textSecondary,
        fontSize: 16,
        fontFamily: FONTS.body,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});
