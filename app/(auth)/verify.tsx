import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { LoadingState } from '../../components/ui/LoadingState';
import { FeedbackModal, AlertState } from '../../components/ui/FeedbackModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

// Vibrant dark color palette matching the app
const COLORS = {
    primary: '#00D26A',
    primaryDark: '#00A855',
    bgDark: '#0A1A14',
    bgMid: '#0D2818',
    bgLight: '#14332A',
    accent: '#00FFB3',
    accentOrange: '#FF6B35',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    error: '#FF5252',
};

export default function VerifyScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorAlert, setErrorAlert] = useState<AlertState>({ visible: false, title: '', message: '' });
    const router = useRouter();

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setErrorAlert({
                visible: true,
                title: t('common.error'),
                message: t('verify.error_code_length') || 'Please enter a 6-digit code',
                type: 'warning'
            });
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            phone: phone,
            token: otp,
            type: 'sms',
        });
        setLoading(false);

        if (error) {
            setErrorAlert({
                visible: true,
                title: t('common.error'),
                message: error.message,
                type: 'error'
            });
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.bgDark, COLORS.bgMid, COLORS.bgLight]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative glow orbs */}
            <View style={[styles.glowOrb, styles.glowOrb1]} />
            <View style={[styles.glowOrb, styles.glowOrb2]} />

            {loading && <LoadingState message={t('common.loading') || 'Loading...'} />}

            <SafeAreaView style={styles.safeArea}>
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.content}>
                    <GlassCard style={styles.card}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <Ionicons name="shield-checkmark" size={48} color={COLORS.bgDark} />
                        </View>

                        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>
                            {t('verify.title') || 'Phone Verification'}
                        </Text>
                        <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>
                            {t('verify.code_sent_to') || 'Code sent to'} {phone}
                        </Text>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="000000"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={setOtp}
                                autoFocus
                            />
                        </View>

                        <PremiumButton
                            title={t('verify.verify_button') || 'Verify'}
                            onPress={handleVerify}
                            loading={loading}
                            style={styles.button}
                        />

                        <TouchableOpacity style={styles.resendButton}>
                            <Text style={styles.resendText}>{t('verify.resend') || 'Resend Code'}</Text>
                        </TouchableOpacity>
                    </GlassCard>
                </Animated.View>
            </SafeAreaView>

            <FeedbackModal
                visible={errorAlert.visible}
                onClose={() => setErrorAlert({ ...errorAlert, visible: false })}
                title={errorAlert.title}
                message={errorAlert.message}
                buttonText={t('common.ok')}
                type={errorAlert.type || 'error'}
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
        top: -50,
        left: -100,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
    },
    glowOrb2: {
        bottom: 100,
        right: -150,
        backgroundColor: COLORS.accentOrange,
        opacity: 0.08,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    card: {
        padding: SPACING.xl,
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 24,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        overflow: 'hidden',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
        marginBottom: SPACING.s,
        width: '100%',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        width: '100%',
    },
    inputWrapper: {
        width: '100%',
        backgroundColor: COLORS.inputBg,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    input: {
        height: 64,
        color: COLORS.textPrimary,
        fontSize: 32,
        fontFamily: FONTS.heading,
        textAlign: 'center',
        letterSpacing: 8,
    },
    button: {
        width: '100%',
    },
    resendButton: {
        marginTop: SPACING.xl,
    },
    resendText: {
        color: COLORS.primary,
        fontSize: 14,
        fontFamily: FONTS.body,
        fontWeight: 'bold',
    },
});
