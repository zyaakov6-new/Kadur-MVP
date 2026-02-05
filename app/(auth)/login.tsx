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
    interpolate,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Tesla-inspired futuristic color palette
const COLORS = {
    // Core colors - minimal and clean
    background: '#000000',
    surface: '#0A0A0A',
    surfaceLight: '#141414',

    // Accent - single signature color
    accent: '#00D4FF',
    accentDim: 'rgba(0, 212, 255, 0.15)',
    accentGlow: 'rgba(0, 212, 255, 0.3)',

    // Text hierarchy
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textTertiary: 'rgba(255, 255, 255, 0.35)',

    // UI elements
    border: 'rgba(255, 255, 255, 0.08)',
    borderFocus: 'rgba(0, 212, 255, 0.5)',
    inputBg: 'rgba(255, 255, 255, 0.03)',

    // States
    error: '#FF3B5C',
    success: '#00D4FF',
};

type InputFieldProps = {
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
};

const InputField = memo(({
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
}: InputFieldProps) => {
    return (
        <View style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
        ]}>
            <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textTertiary}
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
            {isFocused && <View style={styles.inputFocusLine} />}
        </View>
    );
});

// Animated grid line component
const GridLine = ({ delay, horizontal }: { delay: number; horizontal?: boolean }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.03, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                horizontal ? styles.gridLineHorizontal : styles.gridLineVertical,
                animatedStyle,
                { [horizontal ? 'top' : 'left']: `${delay}%` }
            ]}
        />
    );
};

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

    // Subtle pulse animation for the logo
    const pulseValue = useSharedValue(1);
    const ringScale = useSharedValue(1);

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success' as 'success' | 'error',
        onClose: () => setModalConfig(prev => ({ ...prev, visible: false })),
    });

    useEffect(() => {
        checkConnection();

        // Subtle breathing animation
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Ring expansion animation
        ringScale.value = withRepeat(
            withSequence(
                withTiming(1.5, { duration: 4000, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 0 })
            ),
            -1,
            false
        );
    }, []);

    const checkConnection = async () => {
        setConnectionStatus('checking');
        const result = await testSupabaseConnection();
        setConnectionStatus(result.success ? 'connected' : 'error');
    };

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
    }));

    const ringAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: interpolate(ringScale.value, [1, 1.5], [0.4, 0]),
    }));

    const showError = (message: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setModalConfig({
            visible: true,
            title: 'Error',
            message: message.includes('Network') || message.includes('fetch')
                ? 'Connection error. Check your internet.'
                : message,
            type: 'error',
            onClose: () => setModalConfig(prev => ({ ...prev, visible: false })),
        });
    };

    const handleAuth = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (connectionStatus === 'error') {
            showError('No server connection. Try again later.');
            return;
        }

        if (!normalizedEmail || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
                            title: 'Account Created',
                            message: 'Check your email to verify your account.',
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
            showError(err.message || 'An error occurred');
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
            {/* Pure black background */}
            <View style={StyleSheet.absoluteFill}>
                {/* Subtle grid pattern */}
                {[10, 25, 40, 55, 70, 85].map((pos, i) => (
                    <GridLine key={`v-${i}`} delay={pos} />
                ))}
                {[15, 35, 55, 75].map((pos, i) => (
                    <GridLine key={`h-${i}`} delay={pos} horizontal />
                ))}
            </View>

            {/* Subtle accent glow at top */}
            <View style={styles.topGlow} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {connectionStatus === 'error' && (
                    <TouchableOpacity onPress={checkConnection} style={styles.connectionBanner}>
                        <View style={styles.connectionDot} />
                        <Text style={styles.connectionText}>Offline - Tap to retry</Text>
                    </TouchableOpacity>
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
                    <Animated.View entering={FadeIn.duration(1000)} style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            {/* Animated ring */}
                            <Animated.View style={[styles.logoRing, ringAnimatedStyle]} />

                            {/* Main logo */}
                            <Animated.View style={[styles.logoInner, logoAnimatedStyle]}>
                                <View style={styles.logoIconContainer}>
                                    <Ionicons name="football-outline" size={32} color={COLORS.accent} />
                                </View>
                            </Animated.View>
                        </View>

                        <Text style={styles.appName}>KADUR</Text>
                        <Text style={styles.tagline}>
                            {isSignUp ? 'Join the game' : 'Find your next match'}
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInUp.delay(300).duration(600)}
                        style={styles.formSection}
                    >
                        {/* Mode Toggle */}
                        <View style={styles.modeToggle}>
                            <TouchableOpacity
                                style={[styles.modeButton, !isSignUp && styles.modeButtonActive]}
                                onPress={() => isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modeText, !isSignUp && styles.modeTextActive]}>
                                    Sign In
                                </Text>
                                {!isSignUp && <View style={styles.modeIndicator} />}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeButton, isSignUp && styles.modeButtonActive]}
                                onPress={() => !isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modeText, isSignUp && styles.modeTextActive]}>
                                    Sign Up
                                </Text>
                                {isSignUp && <View style={styles.modeIndicator} />}
                            </TouchableOpacity>
                        </View>

                        {/* Input Fields */}
                        <View style={styles.inputsContainer}>
                            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <InputField
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
                            </Animated.View>

                            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <InputField
                                    inputRef={passwordRef}
                                    placeholder="Enter password"
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
                            </Animated.View>

                            {isSignUp && (
                                <Animated.View entering={FadeInDown.duration(400)}>
                                    <Text style={styles.inputLabel}>Confirm Password</Text>
                                    <InputField
                                        inputRef={confirmPasswordRef}
                                        placeholder="Confirm password"
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
                        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (loading || connectionStatus === 'error') && styles.submitButtonDisabled,
                                ]}
                                onPress={handleAuth}
                                disabled={loading || connectionStatus === 'error'}
                                activeOpacity={0.8}
                            >
                                <View style={styles.submitButtonInner}>
                                    {loading ? (
                                        <Text style={styles.submitText}>Connecting...</Text>
                                    ) : (
                                        <Text style={styles.submitText}>
                                            {isSignUp ? 'Create Account' : 'Continue'}
                                        </Text>
                                    )}
                                    {!loading && (
                                        <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
                                    )}
                                </View>
                                {/* Glow effect */}
                                <View style={styles.submitGlow} />
                            </TouchableOpacity>
                        </Animated.View>

                        {isSignUp && (
                            <Animated.View entering={FadeIn.delay(700)}>
                                <Text style={styles.hintText}>
                                    Password must contain at least 6 characters
                                </Text>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to our Terms and Privacy Policy
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
                buttonText="Continue"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: COLORS.accent,
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: COLORS.accent,
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
        opacity: 0.3,
    },
    safeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    connectionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 59, 92, 0.1)',
        marginHorizontal: 24,
        marginTop: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 92, 0.2)',
        gap: 10,
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.error,
    },
    connectionText: {
        color: COLORS.error,
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
        paddingBottom: 40,
        paddingTop: 80,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    logoInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    logoIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.accentDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '300',
        color: COLORS.textPrimary,
        letterSpacing: 12,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 14,
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    formSection: {
        marginBottom: 32,
    },
    modeToggle: {
        flexDirection: 'row',
        marginBottom: 32,
        gap: 32,
        justifyContent: 'center',
    },
    modeButton: {
        paddingVertical: 8,
        position: 'relative',
    },
    modeButtonActive: {},
    modeText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textTertiary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    modeTextActive: {
        color: COLORS.textPrimary,
    },
    modeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.accent,
    },
    inputsContainer: {
        gap: 24,
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textTertiary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: COLORS.inputBg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        position: 'relative',
    },
    inputContainerFocused: {
        borderBottomColor: COLORS.accent,
    },
    inputFocusLine: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.accent,
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.textPrimary,
        fontSize: 16,
        textAlign: 'left',
        letterSpacing: 0.5,
    },
    eyeButton: {
        padding: 8,
    },
    submitButton: {
        height: 56,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
        position: 'relative',
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.surfaceLight,
        opacity: 0.5,
    },
    submitButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    submitGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    submitText: {
        color: COLORS.background,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    hintText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 12,
        color: COLORS.textTertiary,
        letterSpacing: 0.3,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: COLORS.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
        letterSpacing: 0.3,
    },
});
