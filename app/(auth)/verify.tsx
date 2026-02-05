import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { FeedbackModal, AlertState } from '../../components/ui/FeedbackModal';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Tesla-inspired futuristic color palette
const COLORS = {
    background: '#000000',
    surface: '#0A0A0A',
    surfaceLight: '#141414',
    accent: '#00D4FF',
    accentDim: 'rgba(0, 212, 255, 0.15)',
    accentGlow: 'rgba(0, 212, 255, 0.3)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textTertiary: 'rgba(255, 255, 255, 0.35)',
    border: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.03)',
    error: '#FF3B5C',
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

    // Scanning animation
    const scanPosition = useSharedValue(0);

    useEffect(() => {
        scanPosition.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const scanLineStyle = useAnimatedStyle(() => ({
        top: `${interpolate(scanPosition.value, [0, 1], [20, 80])}%`,
    }));

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorAlert({
                visible: true,
                title: 'Invalid Code',
                message: 'Please enter a 6-digit verification code',
                type: 'warning'
            });
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
                title: 'Verification Failed',
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
            {/* Accent glow */}
            <View style={styles.topGlow} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>VERIFY</Text>
                    </View>
                    <View style={styles.headerRight} />
                </Animated.View>

                <View style={styles.content}>
                    {/* Icon with pulse effect */}
                    <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.iconSection}>
                        <View style={styles.iconContainer}>
                            <PulseRing delay={0} />
                            <PulseRing delay={700} />
                            <View style={styles.iconInner}>
                                <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.accent} />
                            </View>
                            {/* Scan line */}
                            <Animated.View style={[styles.iconScanLine, scanLineStyle]} />
                        </View>
                    </Animated.View>

                    {/* Title */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.titleSection}>
                        <Text style={styles.title}>Enter verification code</Text>
                        <Text style={styles.subtitle}>
                            We sent a 6-digit code to {phone}
                        </Text>
                    </Animated.View>

                    {/* OTP Input */}
                    <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.inputSection}>
                        <View style={styles.otpContainer}>
                            <TextInput
                                style={styles.otpInput}
                                placeholder="000000"
                                placeholderTextColor={COLORS.textTertiary}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={setOtp}
                                selectionColor={COLORS.accent}
                                autoFocus
                            />
                            <View style={styles.otpUnderline}>
                                <View style={[styles.otpUnderlineSegment, otp.length >= 1 && styles.otpUnderlineActive]} />
                                <View style={[styles.otpUnderlineSegment, otp.length >= 2 && styles.otpUnderlineActive]} />
                                <View style={[styles.otpUnderlineSegment, otp.length >= 3 && styles.otpUnderlineActive]} />
                                <View style={[styles.otpUnderlineSegment, otp.length >= 4 && styles.otpUnderlineActive]} />
                                <View style={[styles.otpUnderlineSegment, otp.length >= 5 && styles.otpUnderlineActive]} />
                                <View style={[styles.otpUnderlineSegment, otp.length >= 6 && styles.otpUnderlineActive]} />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Verify Button */}
                    <Animated.View entering={FadeInDown.delay(500).duration(500)}>
                        <TouchableOpacity
                            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                            onPress={handleVerify}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <View style={styles.verifyButtonInner}>
                                <Text style={styles.verifyText}>
                                    {loading ? 'Verifying...' : 'Verify'}
                                </Text>
                                {!loading && (
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
                                )}
                            </View>
                            <View style={styles.buttonGlow} />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Resend */}
                    <Animated.View entering={FadeIn.delay(600)} style={styles.resendSection}>
                        <Text style={styles.resendText}>Didn't receive the code?</Text>
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={styles.resendLink}>Resend</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>

            <FeedbackModal
                visible={errorAlert.visible}
                onClose={() => setErrorAlert({ ...errorAlert, visible: false })}
                title={errorAlert.title}
                message={errorAlert.message}
                buttonText="Try Again"
                type={errorAlert.type || 'error'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topGlow: {
        position: 'absolute',
        top: -200,
        left: '50%',
        marginLeft: -300,
        width: 600,
        height: 400,
        borderRadius: 300,
        backgroundColor: COLORS.accentGlow,
        opacity: 0.2,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
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
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textTertiary,
        letterSpacing: 3,
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
        marginBottom: 48,
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
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    iconInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    iconScanLine: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: COLORS.accent,
        opacity: 0.5,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: '300',
        color: COLORS.textPrimary,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    inputSection: {
        marginBottom: 32,
    },
    otpContainer: {
        alignItems: 'center',
    },
    otpInput: {
        fontSize: 32,
        fontWeight: '300',
        color: COLORS.textPrimary,
        letterSpacing: 16,
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
        height: 2,
        backgroundColor: COLORS.border,
    },
    otpUnderlineActive: {
        backgroundColor: COLORS.accent,
    },
    verifyButton: {
        height: 56,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
        position: 'relative',
        overflow: 'hidden',
    },
    verifyButtonDisabled: {
        backgroundColor: COLORS.surfaceLight,
        opacity: 0.5,
    },
    verifyButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    buttonGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    verifyText: {
        color: COLORS.background,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    resendSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
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
