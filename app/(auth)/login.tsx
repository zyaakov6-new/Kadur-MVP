import React, { useState, useEffect, useRef, memo } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ScrollView,
    I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, testSupabaseConnection } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
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
    interpolate,
    Easing,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Premium color palette
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

type InputFieldProps = {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: any;
    autoCapitalize?: any;
    onSubmitEditing?: () => void;
    textContentType?: any;
    autoComplete?: any;
    inputRef?: React.Ref<TextInput>;
    showPassword?: boolean;
    onToggleShowPassword?: () => void;
    isFocused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    icon: string;
    error?: boolean;
};

const InputField = memo(({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'none',
    onSubmitEditing,
    textContentType,
    autoComplete,
    inputRef,
    showPassword,
    onToggleShowPassword,
    isFocused,
    onFocus,
    onBlur,
    icon,
    error,
}: InputFieldProps) => {
    const focusAnim = useSharedValue(0);

    useEffect(() => {
        focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    }, [isFocused]);

    const borderStyle = useAnimatedStyle(() => ({
        borderColor: error
            ? COLORS.error
            : isFocused
                ? COLORS.inputFocusBorder
                : COLORS.inputBorder,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(focusAnim.value, [0, 1], [0, 1]),
    }));

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{label}</Text>
            <Animated.View style={[styles.inputContainer, borderStyle]}>
                {/* Focus glow effect */}
                <Animated.View style={[styles.inputGlow, glowStyle]} />

                <View style={styles.inputIconContainer}>
                    <Ionicons
                        name={icon as any}
                        size={20}
                        color={isFocused ? COLORS.accent : COLORS.textTertiary}
                    />
                </View>

                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textDisabled}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    selectionColor={COLORS.accent}
                    onSubmitEditing={onSubmitEditing}
                    returnKeyType={onSubmitEditing ? 'next' : 'done'}
                    textContentType={textContentType}
                    autoComplete={autoComplete}
                    textAlign="right"
                />

                {secureTextEntry && onToggleShowPassword && (
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={onToggleShowPassword}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={COLORS.textTertiary}
                        />
                    </TouchableOpacity>
                )}
            </Animated.View>
        </View>
    );
});

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

    const router = useRouter();
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    // Logo animations
    const logoScale = useSharedValue(0.8);
    const logoOpacity = useSharedValue(0);
    const ringRotation = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success' as 'success' | 'error',
        onClose: () => setModalConfig(prev => ({ ...prev, visible: false })),
    });

    useEffect(() => {
        checkConnection();

        // Logo entrance
        logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        logoOpacity.value = withTiming(1, { duration: 800 });

        // Rotating ring
        ringRotation.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );

        // Pulse effect
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const checkConnection = async () => {
        setConnectionStatus('checking');
        const result = await testSupabaseConnection();
        setConnectionStatus(result.success ? 'connected' : 'error');
    };

    const logoContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${ringRotation.value}deg` }],
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: interpolate(pulseScale.value, [1, 1.15], [0.5, 0]),
    }));

    const showError = (message: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setModalConfig({
            visible: true,
            title: 'שגיאה',
            message: message.includes('Network') || message.includes('fetch')
                ? 'בעיית חיבור לרשת. בדקו את החיבור לאינטרנט.'
                : message,
            type: 'error',
            onClose: () => setModalConfig(prev => ({ ...prev, visible: false })),
        });
    };

    const handleAuth = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (connectionStatus === 'error') {
            showError('אין חיבור לשרת. נסו שוב מאוחר יותר.');
            return;
        }

        if (!normalizedEmail || !password) {
            showError('יש למלא את כל השדות');
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            showError('הסיסמאות לא תואמות');
            return;
        }

        if (password.length < 6) {
            showError('הסיסמה חייבת להכיל לפחות 6 תווים');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
                if (error) {
                    showError(error.message);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (data?.session) {
                        router.replace('/(auth)/profile_setup');
                    } else {
                        setModalConfig({
                            visible: true,
                            title: 'נרשמת בהצלחה',
                            message: 'שלחנו קישור אימות לאימייל שלך',
                            type: 'success',
                            onClose: () => {
                                setModalConfig(prev => ({ ...prev, visible: false }));
                                setIsSignUp(false);
                                setPassword('');
                                setConfirmPassword('');
                            },
                        });
                    }
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                if (error) {
                    showError(error.message);
                } else {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', data.user.id)
                        .maybeSingle();

                    if (profileError) {
                        const isMissingProfiles = profileError.message?.includes('profiles')
                            || profileError.message?.includes('schema cache');
                        if (isMissingProfiles) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.replace('/(tabs)');
                            return;
                        }
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace(profile ? '/(tabs)' : '/(auth)/profile_setup');
                }
            }
        } catch (err: any) {
            showError(err.message || 'אירעה שגיאה');
        }

        setLoading(false);
    };

    const toggleMode = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsSignUp(!isSignUp);
        setPassword('');
        setConfirmPassword('');
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
                {/* Connection status */}
                {connectionStatus === 'error' && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                        <TouchableOpacity onPress={checkConnection} style={styles.connectionBanner}>
                            <LinearGradient
                                colors={[COLORS.errorBg, 'transparent']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                            <Ionicons name="cloud-offline-outline" size={18} color={COLORS.error} />
                            <Text style={styles.connectionText}>אין חיבור - לחצו לנסות שוב</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Section */}
                    <Animated.View style={[styles.logoSection, logoContainerStyle]}>
                        <View style={styles.logoContainer}>
                            {/* Pulse effect */}
                            <Animated.View style={[styles.logoPulse, pulseStyle]} />

                            {/* Rotating ring */}
                            <Animated.View style={[styles.logoRing, ringStyle]}>
                                <LinearGradient
                                    colors={[COLORS.accent, 'transparent', COLORS.accentDark, 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            </Animated.View>

                            {/* Inner circle */}
                            <View style={styles.logoInner}>
                                <LinearGradient
                                    colors={[COLORS.bgSecondary, COLORS.bgPrimary]}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.logoIconBg}>
                                    <Ionicons name="football" size={36} color={COLORS.accent} />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.appName}>כדור</Text>
                        <Text style={styles.tagline}>
                            {isSignUp ? 'הצטרפו לקהילת השחקנים' : 'מצאו משחקים באיזור שלכם'}
                        </Text>
                    </Animated.View>

                    {/* Form Card */}
                    <Animated.View
                        entering={FadeInUp.delay(300).duration(500)}
                        style={styles.formCard}
                    >
                        {/* Glass effect */}
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.formCardBorder} />

                        {/* Mode Toggle */}
                        <View style={styles.modeToggle}>
                            <TouchableOpacity
                                style={[styles.modeButton, !isSignUp && styles.modeButtonActive]}
                                onPress={() => isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                {!isSignUp && (
                                    <LinearGradient
                                        colors={[COLORS.accent, COLORS.accentDark]}
                                        style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                )}
                                <Text style={[styles.modeText, !isSignUp && styles.modeTextActive]}>
                                    התחברות
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeButton, isSignUp && styles.modeButtonActive]}
                                onPress={() => !isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                {isSignUp && (
                                    <LinearGradient
                                        colors={[COLORS.accent, COLORS.accentDark]}
                                        style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                )}
                                <Text style={[styles.modeText, isSignUp && styles.modeTextActive]}>
                                    הרשמה
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Input Fields */}
                        <View style={styles.inputsContainer}>
                            <InputField
                                label="אימייל"
                                icon="mail-outline"
                                placeholder="your@email.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                textContentType="emailAddress"
                                autoComplete="email"
                                isFocused={focusedField === 'email'}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />

                            <InputField
                                inputRef={passwordRef}
                                label="סיסמה"
                                icon="lock-closed-outline"
                                placeholder="הזינו סיסמה"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                onSubmitEditing={() => isSignUp ? confirmPasswordRef.current?.focus() : handleAuth()}
                                textContentType={isSignUp ? 'newPassword' : 'password'}
                                autoComplete={isSignUp ? 'new-password' : 'password'}
                                showPassword={showPassword}
                                onToggleShowPassword={() => setShowPassword(!showPassword)}
                                isFocused={focusedField === 'password'}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />

                            {isSignUp && (
                                <Animated.View entering={FadeInDown.duration(300)}>
                                    <InputField
                                        inputRef={confirmPasswordRef}
                                        label="אימות סיסמה"
                                        icon="shield-checkmark-outline"
                                        placeholder="הזינו שוב את הסיסמה"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        onSubmitEditing={handleAuth}
                                        textContentType="newPassword"
                                        autoComplete="new-password"
                                        showPassword={showPassword}
                                        onToggleShowPassword={() => setShowPassword(!showPassword)}
                                        isFocused={focusedField === 'confirmPassword'}
                                        onFocus={() => setFocusedField('confirmPassword')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </Animated.View>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (loading || connectionStatus === 'error') && styles.submitButtonDisabled,
                            ]}
                            onPress={handleAuth}
                            disabled={loading || connectionStatus === 'error'}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={loading || connectionStatus === 'error'
                                    ? [COLORS.cardBg, COLORS.cardBg]
                                    : [COLORS.accent, COLORS.accentDark]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            {/* Button shine effect */}
                            <View style={styles.buttonShine} />

                            <View style={styles.submitContent}>
                                {loading ? (
                                    <Text style={styles.submitText}>מתחבר...</Text>
                                ) : (
                                    <>
                                        <Ionicons name="arrow-back" size={20} color={COLORS.bgPrimary} />
                                        <Text style={styles.submitText}>
                                            {isSignUp ? 'צור חשבון' : 'התחברות'}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>

                        {isSignUp && (
                            <Text style={styles.hintText}>
                                הסיסמה חייבת להכיל לפחות 6 תווים
                            </Text>
                        )}
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View entering={FadeIn.delay(600)} style={styles.footer}>
                        <Text style={styles.footerText}>
                            בהמשך השימוש אתם מסכימים לתנאי השימוש ומדיניות הפרטיות
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            <FeedbackModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                buttonText="המשך"
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    connectionBanner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 71, 87, 0.3)',
        gap: 10,
        overflow: 'hidden',
    },
    connectionText: {
        color: COLORS.error,
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        paddingBottom: 40,
        paddingTop: 60,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoPulse: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.accentGlow,
    },
    logoRing: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    logoInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    logoIconBg: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.accentSubtle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 48,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: 4,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        backgroundColor: COLORS.cardBg,
    },
    formCardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    modeToggle: {
        flexDirection: 'row-reverse',
        backgroundColor: COLORS.inputBg,
        borderRadius: 14,
        padding: 4,
        marginBottom: 28,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    modeButtonActive: {},
    modeText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textTertiary,
    },
    modeTextActive: {
        color: COLORS.bgPrimary,
    },
    inputsContainer: {
        gap: 20,
        marginBottom: 28,
    },
    inputWrapper: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'right',
        marginRight: 4,
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        height: 56,
        borderRadius: 14,
        backgroundColor: COLORS.inputBg,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    inputGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 14,
        backgroundColor: COLORS.accentSubtle,
    },
    inputIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.textPrimary,
        fontSize: 16,
        textAlign: 'right',
    },
    eyeButton: {
        padding: 8,
    },
    submitButton: {
        height: 58,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    submitButtonDisabled: {
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
    submitContent: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitText: {
        color: COLORS.bgPrimary,
        fontSize: 17,
        fontWeight: '700',
    },
    hintText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 13,
        color: COLORS.textTertiary,
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
