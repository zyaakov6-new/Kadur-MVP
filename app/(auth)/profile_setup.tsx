import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { FeedbackModal } from '../../components/ui/FeedbackModal';

export default function ProfileSetupScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const [fullName, setFullName] = useState('');
    const [city, setCity] = useState('');
    const [position, setPosition] = useState('');
    const [loading, setLoading] = useState(false);
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

    const handleSave = async () => {
        if (!fullName || !city) {
            setModalConfig({
                visible: true,
                title: t('common.error'),
                message: t('profile_setup.error_fill_fields'),
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }
        if (!session?.user) return;

        setLoading(true);
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: session.user.id,
                full_name: fullName,
                city: city,
                favorite_position: position,
            });
        setLoading(false);

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
                message: t('profile_setup.success_message'),
                type: 'success',
                onClose: () => {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                    router.replace('/(tabs)');
                }
            });
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
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassCard style={styles.formCard}>
                            <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t('profile_setup.title')}</Text>
                            <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>{t('profile_setup.subtitle')}</Text>

                            <View style={styles.inputSection}>
                                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('profile_setup.label_name')}</Text>
                                <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="person-outline" size={20} color={COLORS.textTertiary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                                    <TextInput
                                        style={[styles.input, isRTL && { textAlign: 'right' }]}
                                        placeholder={t('profile_setup.placeholder_name')}
                                        placeholderTextColor={COLORS.textTertiary}
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('profile_setup.label_city')}</Text>
                                <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="location-outline" size={20} color={COLORS.textTertiary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                                    <TextInput
                                        style={[styles.input, isRTL && { textAlign: 'right' }]}
                                        placeholder={t('profile_setup.placeholder_city')}
                                        placeholderTextColor={COLORS.textTertiary}
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('profile_setup.label_position')}</Text>
                                <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="football-outline" size={20} color={COLORS.textTertiary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                                    <TextInput
                                        style={[styles.input, isRTL && { textAlign: 'right' }]}
                                        placeholder={t('profile_setup.placeholder_position')}
                                        placeholderTextColor={COLORS.textTertiary}
                                        value={position}
                                        onChangeText={setPosition}
                                    />
                                </View>
                            </View>

                            <PremiumButton
                                title={t('profile_setup.button_lets_play')}
                                onPress={handleSave}
                                loading={loading}
                                icon={<Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color="white" />}
                                style={styles.button}
                            />
                        </GlassCard>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>

            <FeedbackModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                buttonText={modalConfig.type === 'success' ? t('profile_setup.button_lets_play') : t('common.ok')}
                icon={modalConfig.type === 'success' ? "football" : undefined}
            />
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    formCard: {
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        marginBottom: 8,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontFamily: FONTS.body,
        marginBottom: 32,
    },
    inputSection: {
        marginBottom: SPACING.l,
    },
    label: {
        color: COLORS.turfGreen,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        fontFamily: FONTS.body,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: 16,
        height: 56,
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
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.l,
        shadowColor: COLORS.turfGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
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
});
