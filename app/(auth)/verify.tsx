import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { LoadingState } from '../../components/ui/LoadingState';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VerifyScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert(t('common.error'), t('common.error_otp'));
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
            Alert.alert(t('common.error'), error.message);
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.backgroundGradient as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {loading && <LoadingState message={t('common.loading')} />}

            <SafeAreaView style={styles.safeArea}>
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.content}>
                    <GlassCard style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="shield-checkmark" size={48} color={COLORS.turfGreen} />
                        </View>

                        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t('common.verify_phone')}</Text>
                        <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>
                            {t('common.enter_code', { phone })}
                        </Text>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="000000"
                                placeholderTextColor={COLORS.textTertiary}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={otp}
                                onChangeText={setOtp}
                                autoFocus
                            />
                        </View>

                        <PremiumButton
                            title={t('common.verify')}
                            onPress={handleVerify}
                            loading={loading}
                            style={styles.button}
                        />

                        <TouchableOpacity style={styles.resendButton}>
                            <Text style={styles.resendText}>Resend Code</Text>
                        </TouchableOpacity>
                    </GlassCard>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
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
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    input: {
        height: 64,
        color: 'white',
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
        color: COLORS.turfGreen,
        fontSize: 14,
        fontFamily: FONTS.body,
        fontWeight: 'bold',
    },
});
