import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { LoadingState } from '../../components/ui/LoadingState';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
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

    const handleAuth = async () => {
        if (!email || !password) {
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

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setModalConfig({
                    visible: true,
                    title: t('common.error'),
                    message: error.message,
                    type: 'error',
                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                });
            } else {
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
                setModalConfig({
                    visible: true,
                    title: t('common.error'),
                    message: error.message,
                    type: 'error',
                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                });
            } else {
                // Check if profile exists
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', data.user.id)
                    .maybeSingle(); // maybeSingle handles 0 rows without PGRST116 error

                if (profileError) {
                    setModalConfig({
                        visible: true,
                        title: t('common.error'),
                        message: profileError.message,
                        type: 'error',
                        onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                    });
                } else if (profile) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/profile_setup');
                }
            }
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
                end={{ x: 1, y: 1 }}
            />

            {/* Language Switcher */}
            <SafeAreaView style={styles.languageContainer}>
                <LanguageSwitcher />
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <GlassCard style={styles.formCard}>
                    <Text style={styles.title}>{isSignUp ? t('auth.signup_title') : t('auth.welcome_back_title')}</Text>
                    <Text style={styles.subtitle}>
                        {isSignUp ? t('auth.join_league') : t('auth.welcome_back')}
                    </Text>

                    <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.textTertiary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                        <TextInput
                            style={[styles.input, isRTL && { textAlign: 'right' }]}
                            placeholder={t('auth.email')}
                            placeholderTextColor={COLORS.textTertiary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textTertiary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                        <TextInput
                            style={[styles.input, isRTL && { textAlign: 'right' }]}
                            placeholder={t('auth.password')}
                            placeholderTextColor={COLORS.textTertiary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <PremiumButton
                        title={isSignUp ? t('auth.signup_button') : t('auth.signin_button')}
                        onPress={handleAuth}
                        loading={loading}
                        style={styles.button}
                    />

                    <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                        <Text style={styles.linkText}>
                            {isSignUp ? t('auth.has_account') : t('auth.no_account')}
                        </Text>
                    </TouchableOpacity>
                </GlassCard>
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
    languagePill: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    langButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    langButtonActive: {
        backgroundColor: COLORS.turfGreen,
    },
    langText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    langTextActive: {
        color: 'white',
    },
    langDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 4,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    formCard: {
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: FONTS.heading,
        letterSpacing: 2,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: FONTS.body,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: 16,
        height: 60,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontFamily: FONTS.body,
        height: '100%',
    },
    button: {
        backgroundColor: COLORS.turfGreen,
        borderRadius: BORDER_RADIUS.m,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.m,
        shadowColor: COLORS.turfGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.heading,
    },
    linkText: {
        color: COLORS.accentOrange,
        textAlign: 'center',
        marginTop: 30,
        fontSize: 14,
        fontFamily: FONTS.body,
        fontWeight: '600',
    },
});
