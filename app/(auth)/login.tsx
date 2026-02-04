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
    Easing,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Apple-inspired color palette
const COLORS = {
    // Primary brand
    primary: '#34C759',
    primaryDark: '#248A3D',
    primaryLight: '#30D158',

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',

    // Text
    label: '#000000',
    secondaryLabel: '#3C3C43',
    tertiaryLabel: '#8E8E93',
    placeholderText: '#C7C7CC',

    // System
    separator: '#E5E5EA',
    opaqueSeparator: '#C6C6C8',
    systemGray: '#8E8E93',
    systemGray2: '#AEAEB2',
    systemGray3: '#C7C7CC',
    systemGray4: '#D1D1D6',
    systemGray5: '#E5E5EA',
    systemGray6: '#F2F2F7',

    // Semantic
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
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
                placeholderTextColor={COLORS.placeholderText}
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
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.tertiaryLabel}
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
    const logoScale = useSharedValue(0.8);
    const logoOpacity = useSharedValue(0);

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success' as 'success' | 'error',
        onClose: () => setModalConfig(prev => ({ ...prev, visible: false })),
    });

    useEffect(() => {
        checkConnection();

        // Entrance animation
        logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        logoOpacity.value = withTiming(1, { duration: 600 });
    }, []);

    const checkConnection = async () => {
        setConnectionStatus('checking');
        const result = await testSupabaseConnection();
        setConnectionStatus(result.success ? 'connected' : 'error');
    };

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
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
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Connection Status - Minimal */}
                {connectionStatus === 'error' && (
                    <TouchableOpacity onPress={checkConnection} style={styles.connectionBanner}>
                        <Ionicons name="wifi-outline" size={16} color={COLORS.error} />
                        <Text style={styles.connectionText}>אין חיבור</Text>
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
                    <Animated.View style={[styles.logoSection, logoAnimatedStyle]}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryDark]}
                                style={styles.logoGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="football" size={40} color="white" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.appName}>כדור</Text>
                        <Text style={styles.tagline}>
                            {isSignUp ? 'הצטרפו למשחק' : 'ברוכים השבים'}
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(500)}
                        style={styles.formSection}
                    >
                        {/* Segmented Control */}
                        <View style={styles.segmentedControl}>
                            <TouchableOpacity
                                style={[
                                    styles.segmentButton,
                                    !isSignUp && styles.segmentButtonActive,
                                ]}
                                onPress={() => isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    !isSignUp && styles.segmentTextActive,
                                ]}>
                                    התחברות
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segmentButton,
                                    isSignUp && styles.segmentButtonActive,
                                ]}
                                onPress={() => !isSignUp && toggleMode()}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    isSignUp && styles.segmentTextActive,
                                ]}>
                                    הרשמה
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Input Fields */}
                        <View style={styles.inputsContainer}>
                            <InputField
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
                            {loading ? (
                                <Animated.View entering={FadeIn} style={styles.loadingContainer}>
                                    <Text style={styles.submitButtonText}>רגע...</Text>
                                </Animated.View>
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isSignUp ? 'יצירת חשבון' : 'התחברות'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Password hint for signup */}
                        {isSignUp && (
                            <Text style={styles.hintText}>
                                הסיסמה חייבת להכיל לפחות 6 תווים
                            </Text>
                        )}
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View
                        entering={FadeIn.delay(400)}
                        style={styles.footer}
                    >
                        <Text style={styles.footerText}>
                            בהמשך השימוש באפליקציה אתם מאשרים את{'\n'}
                            <Text style={styles.footerLink}>תנאי השימוש</Text>
                            {' ו'}
                            <Text style={styles.footerLink}>מדיניות הפרטיות</Text>
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
                buttonText="אישור"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        backgroundColor: COLORS.background,
    },
    connectionBanner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFF3F3',
        gap: 6,
    },
    connectionText: {
        color: COLORS.error,
        fontSize: 13,
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    appName: {
        fontSize: 34,
        fontWeight: '700',
        color: COLORS.label,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    tagline: {
        fontSize: 17,
        color: COLORS.secondaryLabel,
        fontWeight: '400',
    },
    formSection: {
        marginBottom: 32,
    },
    segmentedControl: {
        flexDirection: 'row-reverse',
        backgroundColor: COLORS.systemGray6,
        borderRadius: 10,
        padding: 3,
        marginBottom: 24,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentButtonActive: {
        backgroundColor: COLORS.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.tertiaryLabel,
    },
    segmentTextActive: {
        color: COLORS.label,
        fontWeight: '600',
    },
    inputsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        height: 52,
        borderRadius: 12,
        backgroundColor: COLORS.systemGray6,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputContainerFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.background,
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.label,
        fontSize: 17,
        textAlign: 'right',
    },
    eyeButton: {
        padding: 4,
        marginLeft: 8,
    },
    submitButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonDisabled: {
        backgroundColor: COLORS.systemGray3,
        shadowOpacity: 0,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    hintText: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 13,
        color: COLORS.tertiaryLabel,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: COLORS.tertiaryLabel,
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: COLORS.primary,
    },
});
