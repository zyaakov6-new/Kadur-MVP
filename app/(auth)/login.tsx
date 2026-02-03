import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, testSupabaseConnection } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { LoadingState } from '../../components/ui/LoadingState';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
        onClose: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: () => { }
    });
    const router = useRouter();
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    // Test connection on mount
    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        setConnectionStatus('checking');
        const result = await testSupabaseConnection();
        setConnectionStatus(result.success ? 'connected' : 'error');
        if (!result.success) {
            console.log('Connection test failed:', result.error);
        }
    };

    const getNetworkErrorMessage = (errorMessage: string): string => {
        if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
            return 'Unable to connect to the server. Please check:\n\n' +
                '1. Your internet connection\n' +
                '2. Try switching between WiFi and mobile data\n' +
                '3. Disable VPN if you\'re using one\n' +
                '4. Try again in a few moments';
        }
        return errorMessage;
    };

    const handleAuth = async () => {
        if (!email || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setModalConfig({
                visible: true,
                title: t('common.error'),
                message: t('create_game.error_fill_fields'),
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setModalConfig({
                        visible: true,
                        title: t('common.error'),
                        message: getNetworkErrorMessage(error.message),
                        type: 'error',
                        onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                    });
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setModalConfig({
                        visible: true,
                        title: t('common.success'),
                        message: t('auth.create_account'),
                        type: 'success',
                        onClose: () => {
                            setModalConfig(prev => ({ ...prev, visible: false }));
                            router.replace('/(auth)/profile_setup');
                        }
                    });
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setModalConfig({
                        visible: true,
                        title: t('common.error'),
                        message: getNetworkErrorMessage(error.message),
                        type: 'error',
                        onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                    });
                } else {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', data.user.id)
                        .maybeSingle();

                    if (profileError) {
                        setModalConfig({
                            visible: true,
                            title: t('common.error'),
                            message: getNetworkErrorMessage(profileError.message),
                            type: 'error',
                            onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                        });
                    } else if (profile) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        router.replace('/(tabs)');
                    } else {
                        router.replace('/(auth)/profile_setup');
                    }
                }
            }
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setModalConfig({
                visible: true,
                title: 'Connection Error',
                message: getNetworkErrorMessage(err.message || 'An unexpected error occurred'),
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            {loading && <LoadingState message={isSignUp ? t('auth.creating_account') : t('common.signing_in')} />}
            <LinearGradient
                colors={COLORS.backgroundGradient as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Language Switcher */}
            <SafeAreaView style={styles.languageContainer}>
                <LanguageSwitcher />
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Brand */}
                <Animated.View entering={FadeIn.delay(100)} style={styles.brandContainer}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
                            style={styles.logoGradient}
                        >
                            <Ionicons name="football" size={36} color="white" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.brandText}>KADUR</Text>

                    {/* Connection Status */}
                    <TouchableOpacity
                        onPress={checkConnection}
                        style={[
                            styles.connectionBadge,
                            connectionStatus === 'connected' && styles.connectionConnected,
                            connectionStatus === 'error' && styles.connectionError,
                        ]}
                    >
                        <View style={[
                            styles.connectionDot,
                            connectionStatus === 'checking' && styles.dotChecking,
                            connectionStatus === 'connected' && styles.dotConnected,
                            connectionStatus === 'error' && styles.dotError,
                        ]} />
                        <Text style={styles.connectionText}>
                            {connectionStatus === 'checking' ? 'Checking...' :
                                connectionStatus === 'connected' ? 'Connected' : 'No Connection - Tap to retry'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <GlassCard style={styles.formCard} variant="elevated">
                        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
                            {isSignUp ? t('auth.signup_title') : t('auth.welcome_back_title')}
                        </Text>
                        <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>
                            {isSignUp ? t('auth.join_league') : t('auth.welcome_back')}
                        </Text>

                        {/* Email Input */}
                        <View style={[
                            styles.inputWrapper,
                            isRTL && { flexDirection: 'row-reverse' },
                            focusedInput === 'email' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color={focusedInput === 'email' ? COLORS.turfGreenLight : COLORS.textTertiary}
                                />
                            </View>
                            <TextInput
                                style={[styles.input, isRTL && { textAlign: 'right' }]}
                                placeholder={t('auth.email')}
                                placeholderTextColor={COLORS.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                selectionColor={COLORS.turfGreenLight}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={[
                            styles.inputWrapper,
                            isRTL && { flexDirection: 'row-reverse' },
                            focusedInput === 'password' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={18}
                                    color={focusedInput === 'password' ? COLORS.turfGreenLight : COLORS.textTertiary}
                                />
                            </View>
                            <TextInput
                                style={[styles.input, isRTL && { textAlign: 'right' }]}
                                placeholder={t('auth.password')}
                                placeholderTextColor={COLORS.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                selectionColor={COLORS.turfGreenLight}
                            />
                        </View>

                        <PremiumButton
                            title={isSignUp ? t('auth.signup_button') : t('auth.signin_button')}
                            onPress={handleAuth}
                            loading={loading}
                            disabled={connectionStatus === 'error'}
                            style={styles.button}
                            size="large"
                            icon={<Ionicons name={isSignUp ? "person-add" : "log-in"} size={20} color="white" />}
                        />

                        {connectionStatus === 'error' && (
                            <Text style={styles.errorHint}>
                                Please check your internet connection and tap "No Connection" above to retry
                            </Text>
                        )}

                        <View style={styles.dividerRow}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>{t('auth.or')}</Text>
                            <View style={styles.divider} />
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setIsSignUp(!isSignUp);
                            }}
                            style={styles.switchButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.switchText}>
                                {isSignUp ? t('auth.has_account') : t('auth.no_account')}
                            </Text>
                        </TouchableOpacity>
                    </GlassCard>
                </Animated.View>
            </KeyboardAvoidingView>

            <FeedbackModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                buttonText={t('common.ok')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    languageContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.m,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoContainer: {
        marginBottom: SPACING.m,
    },
    logoGradient: {
        width: 72,
        height: 72,
        borderRadius: BORDER_RADIUS.l,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.glow,
    },
    brandText: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        fontFamily: FONTS.heading,
        letterSpacing: 4,
        marginBottom: SPACING.m,
    },
    connectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    connectionConnected: {
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
    },
    connectionError: {
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.xs,
    },
    dotChecking: {
        backgroundColor: COLORS.warning,
    },
    dotConnected: {
        backgroundColor: COLORS.success,
    },
    dotError: {
        backgroundColor: COLORS.error,
    },
    connectionText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontFamily: FONTS.body,
    },
    formCard: {
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.xl,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: 'white',
        marginBottom: SPACING.xs,
        fontFamily: FONTS.heading,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: SPACING.xl,
        fontFamily: FONTS.body,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderRadius: BORDER_RADIUS.m,
        height: 56,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    inputWrapperFocused: {
        borderColor: COLORS.inputFocusBorder,
        backgroundColor: 'rgba(0, 135, 90, 0.05)',
    },
    inputIconContainer: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        fontFamily: FONTS.body,
        height: '100%',
        paddingRight: SPACING.m,
    },
    button: {
        marginTop: SPACING.s,
    },
    errorHint: {
        color: COLORS.error,
        fontSize: 12,
        fontFamily: FONTS.body,
        textAlign: 'center',
        marginTop: SPACING.m,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    dividerText: {
        color: COLORS.textTertiary,
        fontSize: 12,
        fontFamily: FONTS.body,
        marginHorizontal: SPACING.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    switchButton: {
        alignItems: 'center',
        paddingVertical: SPACING.s,
    },
    switchText: {
        color: COLORS.accentOrange,
        fontSize: 14,
        fontFamily: FONTS.body,
        fontWeight: '600',
    },
});
