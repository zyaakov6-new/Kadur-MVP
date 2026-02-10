import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { FeedbackModal, AlertState } from '../../components/ui/FeedbackModal';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Premium color palette (matching login.tsx)
const COLORS = {
    // Backgrounds
    bgPrimary: '#050A08',
    bgSecondary: '#0A1510',
    bgTertiary: '#0F1F18',

    // Accent - emerald green
    accent: '#00E87B',
    accentLight: '#4DFFA6',
    accentDark: '#00B85E',
    accentGlow: 'rgba(0, 232, 123, 0.25)',
    accentSubtle: 'rgba(0, 232, 123, 0.08)',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.72)',
    textTertiary: 'rgba(255, 255, 255, 0.45)',
    textDisabled: 'rgba(255, 255, 255, 0.25)',

    // UI
    cardBg: 'rgba(255, 255, 255, 0.04)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputFocusBorder: 'rgba(0, 232, 123, 0.6)',

    // States
    error: '#FF4757',
    errorBg: 'rgba(255, 71, 87, 0.12)',
    success: '#00E87B',
};

// Floating particle component
const FloatingParticle = ({ delay, size, x, duration }: { delay: number; size: number; x: number; duration: number }) => {
    const translateY = useSharedValue(height + 50);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withTiming(-50, { duration, easing: Easing.linear }),
                -1,
                false
            )
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.6, { duration: duration * 0.2 }),
                    withTiming(0.6, { duration: duration * 0.6 }),
                    withTiming(0, { duration: duration * 0.2 })
                ),
                -1,
                false
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: x,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: COLORS.accent,
                },
                animatedStyle,
            ]}
        />
    );
};

// Animated pulse ring component
const PulseRing = ({ delay = 0 }: { delay?: number }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.6);

    useEffect(() => {
        const timeout = setTimeout(() => {
            scale.value = withRepeat(
                withTiming(2, { duration: 2000, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
            opacity.value = withRepeat(
                withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
                -1,
                false
            );
        }, delay);

        return () => clearTimeout(timeout);
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.pulseRing, animatedStyle]} />;
};

export default function VerifyScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorAlert, setErrorAlert] = useState<AlertState>({ visible: false, title: '', message: '' });
    const router = useRouter();

    // Icon animations
    const iconScale = useSharedValue(0.8);
    const ringRotation = useSharedValue(0);

    useEffect(() => {
        iconScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        ringRotation.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const iconContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${ringRotation.value}deg` }],
    }));

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorAlert({
                visible: true,
                title: 'קוד לא תקין',
                message: 'יש להזין קוד אימות בן 6 ספרות',
                type: 'warning'
            });
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const { error } = await supabase.auth.verifyOtp({
            phone: phone,
            token: otp,
            type: 'sms',
        });

        setLoading(false);

        if (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorAlert({
                visible: true,
                title: 'אימות נכשל',
                message: error.message,
                type: 'error'
            });
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        }
    };

    const handleResend = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Implement resend logic
    };

    return (
        <View style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={[COLORS.bgPrimary, COLORS.bgSecondary, COLORS.bgTertiary]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Floating particles */}
            <View style={styles.particlesContainer} pointerEvents="none">
                <FloatingParticle delay={0} size={3} x={width * 0.1} duration={8000} />
                <FloatingParticle delay={2000} size={2} x={width * 0.25} duration={10000} />
                <FloatingParticle delay={1000} size={4} x={width * 0.4} duration={7000} />
                <FloatingParticle delay={3000} size={2} x={width * 0.6} duration={9000} />
                <FloatingParticle delay={500} size={3} x={width * 0.75} duration={11000} />
                <FloatingParticle delay={1500} size={2} x={width * 0.9} duration={8500} />
            </View>

            {/* Top accent glow */}
            <View style={styles.topGlow}>
                <LinearGradient
                    colors={['transparent', COLORS.accentGlow, 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-forward" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>אימות</Text>
                    </View>
                    <View style={styles.headerRight} />
                </Animated.View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    {/* Icon with pulse effect */}
                    <Animated.View entering={FadeIn.delay(200).duration(800)} style={[styles.iconSection, iconContainerStyle]}>
                        <View style={styles.iconContainer}>
                            <PulseRing delay={0} />
                            <PulseRing delay={700} />
                            {/* Rotating ring */}
                            <Animated.View style={[styles.iconRing, ringStyle]}>
                                <LinearGradient
                                    colors={[COLORS.accent, 'transparent', COLORS.accentDark, 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            </Animated.View>
                            <View style={styles.iconInner}>
                                <LinearGradient
                                    colors={[COLORS.bgSecondary, COLORS.bgPrimary]}
                                    style={StyleSheet.absoluteFill}
                                />
                                <Ionicons name="shield-checkmark" size={36} color={COLORS.accent} />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Title */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.titleSection}>
                        <Text style={styles.title}>הזן קוד אימות</Text>
                        <Text style={styles.subtitle}>
                            שלחנו קוד בן 6 ספרות אל {phone}
                        </Text>
                    </Animated.View>

                    {/* OTP Card */}
                    <Animated.View
                        entering={FadeInUp.delay(400).duration(500)}
                        style={styles.otpCard}
                    >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.otpCardBorder} />

                        <View style={styles.otpContainer}>
                            <TextInput
                                style={styles.otpInput}
                                placeholder="000000"
                                placeholderTextColor={COLORS.textDisabled}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={setOtp}
                                selectionColor={COLORS.accent}
                                autoFocus
                                textAlign="center"
                            />
                            <View style={styles.otpUnderline}>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.otpUnderlineSegment,
                                            otp.length > i && styles.otpUnderlineActive
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    </Animated.View>

                    {/* Verify Button */}
                    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.buttonSection}>
                        <TouchableOpacity
                            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                            onPress={handleVerify}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={loading ? [COLORS.cardBg, COLORS.cardBg] : [COLORS.accent, COLORS.accentDark]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <View style={styles.buttonShine} />
                            <View style={styles.verifyButtonInner}>
                                {loading ? (
                                    <Text style={styles.verifyText}>מאמת...</Text>
                                ) : (
                                    <>
                                        <Ionicons name="arrow-back" size={20} color={COLORS.bgPrimary} />
                                        <Text style={styles.verifyText}>אמת</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Resend */}
                    <Animated.View entering={FadeIn.delay(600)} style={styles.resendSection}>
                        <Text style={styles.resendText}>לא קיבלת את הקוד?</Text>
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={styles.resendLink}>שלח שוב</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <FeedbackModal
                visible={errorAlert.visible}
                onClose={() => setErrorAlert({ ...errorAlert, visible: false })}
                title={errorAlert.title}
                message={errorAlert.message}
                buttonText="נסה שוב"
                type={errorAlert.type || 'error'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        opacity: 0.6,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    headerRight: {
        width: 44,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    iconSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    pulseRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    iconRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    iconInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    otpCard: {
        borderRadius: 20,
        padding: 28,
        overflow: 'hidden',
        backgroundColor: COLORS.cardBg,
        marginBottom: 24,
    },
    otpCardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    otpContainer: {
        alignItems: 'center',
    },
    otpInput: {
        fontSize: 36,
        fontWeight: '300',
        color: COLORS.textPrimary,
        letterSpacing: 20,
        textAlign: 'center',
        width: '100%',
        height: 64,
    },
    otpUnderline: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 8,
    },
    otpUnderlineSegment: {
        width: 40,
        height: 3,
        borderRadius: 2,
        backgroundColor: COLORS.inputBorder,
    },
    otpUnderlineActive: {
        backgroundColor: COLORS.accent,
    },
    buttonSection: {
        marginBottom: 24,
    },
    verifyButton: {
        height: 58,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    verifyButtonDisabled: {
        shadowOpacity: 0,
    },
    buttonShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    verifyButtonInner: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    verifyText: {
        color: COLORS.bgPrimary,
        fontSize: 17,
        fontWeight: '700',
    },
    resendSection: {
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    resendText: {
        fontSize: 14,
        color: COLORS.textTertiary,
    },
    resendLink: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '600',
    },
});
