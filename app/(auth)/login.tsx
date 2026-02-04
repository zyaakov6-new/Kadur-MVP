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
    withSpring,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Vibrant color palette
const COLORS = {
    // Primary greens
    primary: '#00D26A',
    primaryDark: '#00A855',
    primaryLight: '#00E676',

    // Background gradient
    bgDark: '#0A1A14',
    bgMid: '#0D2818',
    bgLight: '#14332A',

    // Accent colors
    accent: '#00FFB3',
    accentOrange: '#FF6B35',
    accentPurple: '#A855F7',
    accentBlue: '#38BDF8',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',

    // UI elements
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    inputBorder: 'rgba(255, 255, 255, 0.15)',
    inputFocus: 'rgba(0, 210, 106, 0.5)',

    error: '#FF5252',
    success: '#00E676',
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
    icon: string;
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
    icon,
}: InputFieldProps) => {
    return (
        <View style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
        ]}>
            <Ionicons
                name={icon as any}
                size={20}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
                style={styles.inputIcon}
            />
            <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !showPassword}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                onFocus={onFocus}
                onBlur={onBlur}
                selectionColor={COLORS.primary}
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
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={COLORS.textMuted}
                    />
                </TouchableOpacity>
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

    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    // Animations
    const ballBounce = useSharedValue(0);
    const glowPulse = useSharedValue(1);

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
        ballBounce.value = withRepeat(
            withSequence(
                withTiming(-15, { duration: 500 }),
                withTiming(0, { duration: 500 })
            ),
            -1,
            true
        );

        // Glow pulse animation
        glowPulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
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

    const ballAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: ballBounce.value }],
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowPulse.value }],
        opacity: 0.6 / glowPulse.value,
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
                            message: 'שלחנו קישור אימות לאימייל שלך.',
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
            {/* Gradient Background */}
            <LinearGradient
                colors={[COLORS.bgDark, COLORS.bgMid, COLORS.bgLight]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative elements */}
            <Animated.View style={[styles.glowOrb, styles.glowOrb1, glowAnimatedStyle]} />
            <Animated.View style={[styles.glowOrb, styles.glowOrb2, glowAnimatedStyle]} />
            <View style={styles.gridPattern} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Connection Status */}
                {connectionStatus === 'error' && (
                    <TouchableOpacity onPress={checkConnection} style={styles.connectionBanner}>
                        <Ionicons name="cloud-offline" size={16} color={COLORS.error} />
                        <Text style={styles.connectionText}>אין חיבור - לחצו לנסות שוב</Text>
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
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Animated.View style={[styles.logoGlow, glowAnimatedStyle]} />
                            <Animated.View style={[styles.logoBall, ballAnimatedStyle]}>
                                <LinearGradient
                                    colors={[COLORS.accent, COLORS.primary, COLORS.primaryDark]}
                                    style={styles.ballGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="football" size={36} color="white" />
                                </LinearGradient>
                            </Animated.View>
                        </View>

                        <Text style={styles.appName}>כדור</Text>
                        <Text style={styles.tagline}>
                            {isSignUp ? 'הצטרפו למשחק' : 'מצאו משחקים באיזור שלכם'}
                        </Text>
                    </Animated.View>

                    {/* Form Card */}
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(500)}
                        style={styles.formCard}
                    >
                        {/* Tabs */}
                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tab, !isSignUp && styles.tabActive]}
                                onPress={() => isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                {!isSignUp && (
                                    <LinearGradient
                                        colors={[COLORS.primary, COLORS.primaryDark]}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                )}
                                <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>
                                    התחברות
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, isSignUp && styles.tabActive]}
                                onPress={() => !isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                {isSignUp && (
                                    <LinearGradient
                                        colors={[COLORS.primary, COLORS.primaryDark]}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                )}
                                <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>
                                    הרשמה
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Input Fields */}
                        <View style={styles.inputsContainer}>
                            <InputField
                                icon="mail"
                                placeholder="אימייל"
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
                                icon="lock-closed"
                                placeholder="סיסמה"
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
                                        icon="shield-checkmark"
                                        placeholder="אימות סיסמה"
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
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading || connectionStatus === 'error'
                                    ? ['#444', '#333']
                                    : [COLORS.accent, COLORS.primary]}
                                style={styles.submitGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <Text style={styles.submitText}>מתחבר...</Text>
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>
                                            {isSignUp ? 'בואו נתחיל!' : 'יאללה למגרש!'}
                                        </Text>
                                        <Ionicons name="arrow-back" size={20} color={COLORS.bgDark} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {isSignUp && (
                            <Text style={styles.hintText}>
                                הסיסמה חייבת להכיל לפחות 6 תווים
                            </Text>
                        )}
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View entering={FadeIn.delay(500)} style={styles.footer}>
                        <Text style={styles.footerText}>
                            בהמשך השימוש אתם מאשרים את תנאי השימוש ומדיניות הפרטיות
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
                buttonText="יאללה!"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    glowOrb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    glowOrb1: {
        top: -100,
        right: -100,
        backgroundColor: COLORS.primary,
        opacity: 0.15,
    },
    glowOrb2: {
        bottom: 100,
        left: -150,
        backgroundColor: COLORS.accent,
        opacity: 0.1,
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundColor: 'transparent',
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
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 82, 82, 0.15)',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 12,
        gap: 8,
    },
    connectionText: {
        color: COLORS.error,
        fontSize: 13,
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
        marginBottom: 40,
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    logoGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary,
        top: -20,
        left: -20,
    },
    logoBall: {
        width: 80,
        height: 80,
        borderRadius: 40,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    ballGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 42,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    formCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    tabsContainer: {
        flexDirection: 'row-reverse',
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    tabActive: {},
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    tabTextActive: {
        color: COLORS.bgDark,
    },
    inputsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.inputBg,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: COLORS.inputBorder,
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(0, 210, 106, 0.08)',
    },
    inputIcon: {
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
        padding: 4,
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    submitButtonDisabled: {
        shadowOpacity: 0,
    },
    submitGradient: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 18,
    },
    submitText: {
        color: COLORS.bgDark,
        fontSize: 18,
        fontWeight: '700',
    },
    hintText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 13,
        color: COLORS.textMuted,
    },
    footer: {
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
});
