import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { LoadingState } from '../../components/ui/LoadingState';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const COLORS = {
    primary: '#0A7B5F',
    primaryDark: '#075E49',
    primaryLight: '#11A882',
    accent: '#F5B041',
    background: '#F4F6F8',
    surface: '#FFFFFF',
    surfaceLight: '#F9FAFB',
    text: '#0B0F12',
    textSecondary: '#5F6B7A',
    textMuted: '#9AA4AF',
    error: '#D14343',
    border: '#E5E7EB',
};

export default function VerifyScreen() {
    const { isRTL } = useLanguage();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert('שגיאה', 'נא להכניס קוד בן 6 ספרות');
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
            Alert.alert('שגיאה', error.message);
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FAFC', '#EEF2F7', '#F6F8FB']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {loading && <LoadingState message="טוען..." />}

            <SafeAreaView style={styles.safeArea}>
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.content}>
                    <GlassCard style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
                        </View>

                        <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>אימות טלפון</Text>
                        <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>
                            הקוד נשלח אל {phone}
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
                            title="אימות"
                            onPress={handleVerify}
                            loading={loading}
                            style={styles.button}
                        />

                        <TouchableOpacity style={styles.resendButton}>
                            <Text style={styles.resendText}>שלחו שוב</Text>
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
        backgroundColor: COLORS.background,
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
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(17, 168, 130, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
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
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    input: {
        height: 64,
        color: COLORS.text,
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
