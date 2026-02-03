import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TermsOfServiceScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.darkBackground, '#001a10']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
                            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('legal.terms_of_service')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.scrollView}>
                    <GlassCard style={styles.contentCard}>
                        <Text style={[styles.text, isRTL && { textAlign: 'right' }]}>
                            {t('legal.terms_text')}
                        </Text>
                    </GlassCard>
                </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        marginBottom: SPACING.m,
    },
    backButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    backButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: SPACING.m,
    },
    contentCard: {
        padding: SPACING.l,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.l,
    },
    text: {
        color: COLORS.textSecondary,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: FONTS.body,
    },
});
