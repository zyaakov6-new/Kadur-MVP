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
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withTiming,
    withSequence,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#10B981',
    primaryDark: '#0E9F6E',
    primaryLight: '#34D399',
    accent: '#F59E0B',
    background: '#050B0A',
    surface: '#0E1513',
    surfaceLight: '#15201C',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.68)',
    textMuted: 'rgba(255,255,255,0.38)',
    error: '#EF4444',
    border: 'rgba(255,255,255,0.12)',
};

type InputFieldProps = {
    icon: any;
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: any;
    autoCapitalize?: any;
    fieldName: string;
    onSubmitEditing?: () => void;
    textContentType?: any;
    autoComplete?: any;
    inputRef?: React.Ref<TextInput>;
    helper?: string;
    isRTL: boolean;
    showPassword: boolean;
    onToggleShowPassword: () => void;
    focusedField: string | null;
    setFocusedField: (name: string | null) => void;
};

const InputField = memo(({
    icon,
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'none',
    fieldName,
    onSubmitEditing,
    textContentType,
    autoComplete,
    inputRef,
    helper,
    isRTL,
    showPassword,
    onToggleShowPassword,
    focusedField,
    setFocusedField,
}: InputFieldProps) => {
    const isFocused = focusedField === fieldName;

    return (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && { textAlign: 'right' }]}>{label}</Text>
            <View style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused,
            ]}>
                <View style={styles.inputIconContainer}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isFocused ? COLORS.primary : COLORS.textMuted}
                    />
                </View>
                <TextInput
                    ref={inputRef}
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setFocusedField(fieldName)}
                    onBlur={() => setFocusedField(null)}
                    selectionColor={COLORS.primary}
                    onSubmitEditing={onSubmitEditing}
                    returnKeyType={onSubmitEditing ? 'next' : 'done'}
                    textContentType={textContentType}
                    autoComplete={autoComplete}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={onToggleShowPassword}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={COLORS.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {!!helper && (
                <Text style={[styles.inputHelper, isRTL && { textAlign: 'right' }]}>{helper}</Text>
            )}
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
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    // Animations
    const ballY = useSharedValue(0);
    const ballRotate = useSharedValue(0);
    const formScale = useSharedValue(1);

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success' as 'success' | 'error',
        onClose: () => setModalConfig(prev => ({ ...prev, visible: false })),
    });

    useEffect(() => {
        checkConnection();

        // Ball bounce animation
        ballY.value = withRepeat(
            withSequence(
                withTiming(-15, { duration: 600, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) })
            ),
            -1,
            false
        );

        // Ball rotation
        ballRotate.value = withRepeat(
            withTiming(360, { duration: 3000, easing: Easing.linear }),
            -1,
            false
        );

        return () => {
        };
    }, []);

    const checkConnection = async () => {
        setConnectionStatus('checking');
        const result = await testSupabaseConnection();
        setConnectionStatus(result.success ? 'connected' : 'error');
    };

    const ballAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: ballY.value },
            { rotate: `${ballRotate.value}deg` },
        ],
    }));

    const showError = (message: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setModalConfig({
            visible: true,
            title: t('common.error'),
            message: message.includes('Network') || message.includes('fetch')
                ? 'Connection failed. Please check your internet and try again.'
                : message,
            type: 'error',
            onClose: () => setModalConfig(prev => ({ ...prev, visible: false })),
        });
    };

    const handleAuth = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            showError(t('create_game.error_fill_fields'));
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
                if (error) {
                    showError(error.message);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace('/(auth)/profile_setup');
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                if (error) {
                    showError(error.message);
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', data.user.id)
                        .maybeSingle();

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace(profile ? '/(tabs)' : '/(auth)/profile_setup');
                }
            }
        } catch (err: any) {
            showError(err.message || 'An unexpected error occurred');
        }

        setLoading(false);
    };

    const toggleMode = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        formScale.value = withSequence(
            withSpring(0.95),
            withSpring(1)
        );
        setIsSignUp(!isSignUp);
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#050B0A', '#0B1713', '#0A1411']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.ambientGlow} />

            {/* Language Switcher */}
            <SafeAreaView style={styles.topBar} edges={['top']}>
                <View style={styles.brandPill}>
                    <Ionicons name="football" size={14} color={COLORS.primaryLight} />
                    <Text style={styles.brandPillText}>KADUR</Text>
                </View>
                <View style={styles.topBarRight}>
                    <TouchableOpacity
                        onPress={checkConnection}
                        style={[
                            styles.connectionBadge,
                            connectionStatus === 'connected' && styles.connectionOk,
                            connectionStatus === 'error' && styles.connectionError,
                        ]}
                    >
                        <View style={[
                            styles.connectionDot,
                            connectionStatus === 'checking' && { backgroundColor: COLORS.accent },
                            connectionStatus === 'connected' && { backgroundColor: COLORS.primary },
                            connectionStatus === 'error' && { backgroundColor: COLORS.error },
                        ]} />
                        <Text style={styles.connectionText}>
                            {connectionStatus === 'checking' ? 'Connecting...' :
                                connectionStatus === 'connected' ? 'Online' : 'Offline'}
                        </Text>
                    </TouchableOpacity>
                    <LanguageSwitcher />
                </View>
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
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.logoSection}
                    >
                        <Animated.View style={[styles.ballContainer, ballAnimatedStyle]}>
                            <LinearGradient
                                colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryDark]}
                                style={styles.ball}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.ballHighlight} />
                                <View style={styles.ballPattern1} />
                                <View style={styles.ballPattern2} />
                            </LinearGradient>
                        </Animated.View>

                        <Text style={styles.heroEyebrow}>KADUR</Text>
                        <Text style={styles.heroTitle}>
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {isSignUp
                                ? 'Start organizing pickup football in minutes.'
                                : 'Sign in to keep your team moving.'}
                        </Text>
                    </Animated.View>

                    {/* Form Card */}
                    <Animated.View
                        entering={FadeInUp.delay(300).springify()}
                        style={styles.formCard}
                    >
                        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={['rgba(17,24,39,0.55)', 'rgba(8,12,11,0.95)']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Segmented Control */}
                        <View style={styles.segmented}>
                            <TouchableOpacity
                                style={[styles.segmentButton, !isSignUp && styles.segmentButtonActive]}
                                onPress={() => !isSignUp || toggleMode()}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.segmentText, !isSignUp && styles.segmentTextActive]}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentButton, isSignUp && styles.segmentButtonActive]}
                                onPress={() => isSignUp || toggleMode()}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.segmentText, isSignUp && styles.segmentTextActive]}>
                                    Create Account
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Input Fields */}
                        <View style={styles.inputsContainer}>
                            <InputField
                                icon="mail-outline"
                                label="Email"
                                placeholder="Email address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                fieldName="email"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                textContentType="emailAddress"
                                autoComplete="email"
                                isRTL={isRTL}
                                showPassword={showPassword}
                                onToggleShowPassword={() => setShowPassword(!showPassword)}
                                focusedField={focusedField}
                                setFocusedField={setFocusedField}
                            />

                            <InputField
                                inputRef={passwordRef}
                                icon="lock-closed-outline"
                                label="Password"
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                fieldName="password"
                                onSubmitEditing={() => isSignUp ? confirmPasswordRef.current?.focus() : handleAuth()}
                                textContentType={isSignUp ? 'newPassword' : 'password'}
                                autoComplete={isSignUp ? 'new-password' : 'password'}
                                helper={isSignUp ? 'Use at least 6 characters.' : undefined}
                                isRTL={isRTL}
                                showPassword={showPassword}
                                onToggleShowPassword={() => setShowPassword(!showPassword)}
                                focusedField={focusedField}
                                setFocusedField={setFocusedField}
                            />

                            {isSignUp && (
                                <Animated.View entering={FadeInDown.springify()}>
                                    <InputField
                                        inputRef={confirmPasswordRef}
                                        icon="shield-checkmark-outline"
                                        label="Confirm password"
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        fieldName="confirmPassword"
                                        onSubmitEditing={handleAuth}
                                        textContentType="newPassword"
                                        autoComplete="new-password"
                                        isRTL={isRTL}
                                        showPassword={showPassword}
                                        onToggleShowPassword={() => setShowPassword(!showPassword)}
                                        focusedField={focusedField}
                                        setFocusedField={setFocusedField}
                                    />
                                </Animated.View>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleAuth}
                            disabled={loading || connectionStatus === 'error'}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading || connectionStatus === 'error'
                                    ? ['#2A3531', '#1A2420']
                                    : [COLORS.primaryLight, COLORS.primary]}
                                style={styles.submitButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <Animated.View
                                        entering={FadeIn}
                                        style={styles.loadingContainer}
                                    >
                                        <Ionicons name="football" size={20} color="white" />
                                        <Text style={styles.submitButtonText}>Loading...</Text>
                                    </Animated.View>
                                ) : (
                                    <>
                                        <Ionicons
                                            name={isSignUp ? 'person-add' : 'log-in'}
                                            size={20}
                                            color="white"
                                        />
                                        <Text style={styles.submitButtonText}>
                                            {isSignUp ? 'Create Account' : 'Continue'}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Subtle Helper */}
                        <View style={styles.helperRow}>
                            <Text style={styles.helperText}>
                                {isSignUp
                                    ? 'You can change your details later in settings.'
                                    : 'We never share your email with anyone.'}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        entering={FadeIn.delay(500)}
                        style={styles.footer}
                    >
                        <Text style={styles.footerText}>
                            By continuing, you agree to our Terms & Privacy Policy
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
                buttonText="OK"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: COLORS.primary,
        opacity: 0.05,
        top: -120,
        right: -120,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.accent,
        opacity: 0.04,
        bottom: 80,
        left: -70,
    },
    ambientGlow: {
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: 210,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        top: height * 0.18,
        left: -140,
        opacity: 0.5,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    brandPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    brandPillText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
    },
    connectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    connectionOk: {
        backgroundColor: 'rgba(16,185,129,0.1)',
    },
    connectionError: {
        backgroundColor: 'rgba(239,68,68,0.1)',
    },
    connectionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    connectionText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 28,
    },
    ballContainer: {
        marginBottom: 16,
    },
    ball: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    ballHighlight: {
        position: 'absolute',
        width: 30,
        height: 15,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        top: 12,
        left: 15,
        transform: [{ rotate: '-20deg' }],
    },
    ballPattern1: {
        position: 'absolute',
        width: 50,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        top: 38,
    },
    ballPattern2: {
        position: 'absolute',
        width: 2,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        left: 38,
    },
    heroEyebrow: {
        fontSize: 12,
        letterSpacing: 4,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 280,
        lineHeight: 20,
    },
    formCard: {
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 24,
    },
    segmented: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    segmentText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    segmentTextActive: {
        color: 'white',
        fontWeight: '700',
    },
    inputsContainer: {
        gap: 16,
        marginBottom: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(16,185,129,0.06)',
    },
    inputIconContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        height: '100%',
        color: 'white',
        fontSize: 15,
    },
    inputHelper: {
        color: COLORS.textMuted,
        fontSize: 11,
    },
    eyeButton: {
        width: 50,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    submitButtonDisabled: {
        shadowOpacity: 0,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        gap: 10,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    helperRow: {
        marginTop: 14,
        alignItems: 'center',
    },
    helperText: {
        color: COLORS.textMuted,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: 12,
        textAlign: 'center',
    },
});
