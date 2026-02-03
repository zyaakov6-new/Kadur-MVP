import React, { useState, useEffect, useRef } from 'react';
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
    Keyboard,
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
    primaryDark: '#059669',
    primaryLight: '#34D399',
    accent: '#F59E0B',
    background: '#030712',
    surface: '#111827',
    surfaceLight: '#1F2937',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.3)',
    error: '#EF4444',
    border: 'rgba(255,255,255,0.1)',
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
    const [keyboardVisible, setKeyboardVisible] = useState(false);

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

        // Keyboard listeners
        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
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
        if (!email || !password) {
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
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    showError(error.message);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    router.replace('/(auth)/profile_setup');
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

    const InputField = ({
        icon,
        placeholder,
        value,
        onChangeText,
        secureTextEntry,
        keyboardType = 'default',
        autoCapitalize = 'none',
        fieldName,
        onSubmitEditing,
        ref,
    }: any) => {
        const isFocused = focusedField === fieldName;

        return (
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
                    ref={ref}
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
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={COLORS.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#030712', '#0a1628', '#071515']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            {/* Language Switcher */}
            <SafeAreaView style={styles.topBar} edges={['top']}>
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
                    {!keyboardVisible && (
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

                            <Text style={styles.logoText}>KADUR</Text>
                            <Text style={styles.tagline}>
                                {isSignUp ? 'Join the game' : 'Welcome back, player'}
                            </Text>
                        </Animated.View>
                    )}

                    {/* Form Card */}
                    <Animated.View
                        entering={FadeInUp.delay(300).springify()}
                        style={styles.formCard}
                    >
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={['rgba(17,24,39,0.8)', 'rgba(17,24,39,0.95)']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Form Header */}
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </Text>
                            <Text style={styles.formSubtitle}>
                                {isSignUp
                                    ? 'Start playing pickup games today'
                                    : 'Continue your football journey'}
                            </Text>
                        </View>

                        {/* Input Fields */}
                        <View style={styles.inputsContainer}>
                            <InputField
                                icon="mail-outline"
                                placeholder="Email address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                fieldName="email"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />

                            <InputField
                                ref={passwordRef}
                                icon="lock-closed-outline"
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                fieldName="password"
                                onSubmitEditing={() => isSignUp ? confirmPasswordRef.current?.focus() : handleAuth()}
                            />

                            {isSignUp && (
                                <Animated.View entering={FadeInDown.springify()}>
                                    <InputField
                                        ref={confirmPasswordRef}
                                        icon="shield-checkmark-outline"
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        fieldName="confirmPassword"
                                        onSubmitEditing={handleAuth}
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
                                    ? ['#374151', '#1F2937']
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
                                            {isSignUp ? 'Create Account' : 'Sign In'}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={18} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Toggle Mode */}
                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={toggleMode}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.toggleText}>
                                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                <Text style={styles.toggleTextHighlight}>
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
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
        opacity: 0.03,
        top: -100,
        right: -100,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.accent,
        opacity: 0.03,
        bottom: 100,
        left: -80,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    connectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
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
        fontSize: 12,
        fontWeight: '500',
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
        paddingBottom: 32,
    },
    ballContainer: {
        marginBottom: 20,
    },
    ball: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
    logoText: {
        fontSize: 36,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 6,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    formCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 24,
    },
    formHeader: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    inputsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(16,185,129,0.05)',
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
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginHorizontal: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    toggleButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    toggleText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    toggleTextHighlight: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 24,
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: 12,
        textAlign: 'center',
    },
});
