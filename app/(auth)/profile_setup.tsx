import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { FeedbackModal } from '../../components/ui/FeedbackModal';

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

export default function ProfileSetupScreen() {
    const { session } = useAuth();
    const router = useRouter();
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
                title: 'משהו השתבש',
                message: 'נא למלא את כל שדות החובה.',
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }
        if (!session?.user) {
            setModalConfig({
                visible: true,
                title: 'משהו השתבש',
                message: 'לא נמצאה התחברות פעילה. נסו להתחבר מחדש.',
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setLoading(true);
        try {
            const upsertPromise = supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    full_name: fullName,
                    city: city,
                    favorite_position: position,
                });

            const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) => {
                setTimeout(() => resolve({ error: { message: 'בקשה נתקעה. נסו שוב בעוד כמה שניות.' } }), 12000);
            });

            const { error } = await Promise.race([upsertPromise, timeoutPromise]);

            if (error) {
                const isMissingProfiles = error.message?.includes('profiles')
                    || error.message?.includes('schema cache');
                if (isMissingProfiles) {
                    setModalConfig({
                        visible: true,
                        title: 'המשך משחק',
                        message: 'מסך הפרופיל יופעל כשמסד הנתונים יהיה מוכן. ממשיכים לאפליקציה.',
                        type: 'success',
                        onClose: () => {
                            setModalConfig(prev => ({ ...prev, visible: false }));
                            router.replace('/(tabs)');
                        }
                    });
                    return;
                }

                setModalConfig({
                    visible: true,
                    title: 'משהו השתבש',
                    message: error.message,
                    type: 'error',
                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                });
            } else {
                setModalConfig({
                    visible: true,
                    title: 'הכול מוכן',
                    message: 'הפרופיל נשמר בהצלחה.',
                    type: 'success',
                    onClose: () => {
                        setModalConfig(prev => ({ ...prev, visible: false }));
                        router.replace('/(tabs)');
                    }
                });
            }
        } finally {
            setLoading(false);
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
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassCard style={styles.formCard}>
                            <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>בואו נכיר</Text>
                            <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>
                                רגע לפני שמתחילים, ספרו לנו קצת עליכם.
                            </Text>

                            <View style={styles.inputSection}>
                                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>שם מלא</Text>
                                <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                                    <TextInput
                                        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
                                        placeholder="לדוגמה: נועם לוי"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>עיר</Text>
                                <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="location-outline" size={20} color={COLORS.textMuted} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                                    <TextInput
                                        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
                                        placeholder="לדוגמה: תל אביב"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>עמדה מועדפת</Text>
                                <View style={[styles.inputWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="football-outline" size={20} color={COLORS.textMuted} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                                    <TextInput
                                        style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
                                        placeholder="לדוגמה: חלוץ / שוער"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={position}
                                        onChangeText={setPosition}
                                    />
                                </View>
                            </View>

                            <PremiumButton
                                title="בואו נשחק"
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
                buttonText={modalConfig.type === 'success' ? 'בואו נשחק' : 'אישור'}
                icon={modalConfig.type === 'success' ? "football" : undefined}
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
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
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
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
        marginBottom: 8,
        fontFamily: FONTS.body,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        fontFamily: FONTS.body,
        height: '100%',
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.m,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.l,
        shadowColor: COLORS.primary,
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
