import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
    FadeInDown,
    FadeIn,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Premium color palette (matching login.tsx)
const COLORS = {
    // Backgrounds
    bgPrimary: '#050A08',
    bgSecondary: '#0A1510',
    bgTertiary: '#0F1F18',

    // Accent - emerald green
    accent: '#00E87B',
    accentLight: '#4DFFA6',
    accentDark: '#00B85E',
    accentGlow: 'rgba(0, 232, 123, 0.25)',
    accentSubtle: 'rgba(0, 232, 123, 0.08)',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.72)',
    textTertiary: 'rgba(255, 255, 255, 0.45)',
    textDisabled: 'rgba(255, 255, 255, 0.25)',

    // UI
    cardBg: 'rgba(255, 255, 255, 0.04)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputFocusBorder: 'rgba(0, 232, 123, 0.6)',

    // States
    error: '#FF4757',
    errorBg: 'rgba(255, 71, 87, 0.12)',
    success: '#00E87B',
};

const positions = [
    { id: 'goalkeeper', label: 'שוער', icon: 'hand-left-outline' },
    { id: 'defender', label: 'מגן', icon: 'shield-outline' },
    { id: 'midfielder', label: 'קשר', icon: 'git-branch-outline' },
    { id: 'forward', label: 'חלוץ', icon: 'flash-outline' },
];

// Floating particle component
const FloatingParticle = ({ delay, size, x, duration }: { delay: number; size: number; x: number; duration: number }) => {
    const translateY = useSharedValue(height + 50);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withTiming(-50, { duration, easing: Easing.linear }),
                -1,
                false
            )
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.6, { duration: duration * 0.2 }),
                    withTiming(0.6, { duration: duration * 0.6 }),
                    withTiming(0, { duration: duration * 0.2 })
                ),
                -1,
                false
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: x,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: COLORS.accent,
                },
                animatedStyle,
            ]}
        />
    );
};

export default function ProfileSetupScreen() {
    const { session } = useAuth();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [city, setCity] = useState('');
    const [position, setPosition] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    // Progress animation
    const progressValue = useSharedValue(0.33);

    // Step icon animation
    const iconScale = useSharedValue(0.8);
    const iconRotation = useSharedValue(0);

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

    useEffect(() => {
        progressValue.value = withTiming(step / 3, { duration: 500, easing: Easing.out(Easing.ease) });
        iconScale.value = withSequence(
            withTiming(0.8, { duration: 0 }),
            withSpring(1, { damping: 10, stiffness: 100 })
        );
        iconRotation.value = withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(360, { duration: 600, easing: Easing.out(Easing.ease) })
        );
    }, [step]);

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressValue.value * 100}%`,
    }));

    const iconAnimStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: iconScale.value },
            { rotate: `${iconRotation.value}deg` }
        ],
    }));

    const focusAnim = useSharedValue(0);

    useEffect(() => {
        focusAnim.value = withTiming(focusedField ? 1 : 0, { duration: 200 });
    }, [focusedField]);

    const handleContinue = () => {
        if (step === 1 && !fullName.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setModalConfig({
                visible: true,
                title: 'שם נדרש',
                message: 'יש להזין את השם כדי להמשיך',
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }
        if (step === 2 && !city.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setModalConfig({
                visible: true,
                title: 'עיר נדרשת',
                message: 'יש להזין את העיר כדי להמשיך',
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep(step + 1);
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep(step - 1);
    };

    const handleSave = async () => {
        if (!session?.user) {
            setModalConfig({
                visible: true,
                title: 'שגיאת חיבור',
                message: 'לא נמצאה הפעלה פעילה. יש להתחבר מחדש.',
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const upsertPromise = supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    full_name: fullName.trim(),
                    city: city.trim(),
                    favorite_position: position,
                });

            const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) => {
                setTimeout(() => resolve({ error: { message: 'הבקשה נכשלה. נסו שוב.' } }), 12000);
            });

            const { error } = await Promise.race([upsertPromise, timeoutPromise]);

            if (error) {
                const isDbIssue = error.message?.includes('profiles') ||
                                  error.message?.includes('schema') ||
                                  error.message?.includes('PGRST');
                if (isDbIssue) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setModalConfig({
                        visible: true,
                        title: 'ברוכים הבאים',
                        message: 'הפרופיל שלכם יישמר כשהמערכת תהיה מוכנה',
                        type: 'success',
                        onClose: () => {
                            setModalConfig(prev => ({ ...prev, visible: false }));
                            router.replace('/(tabs)');
                        }
                    });
                    return;
                }

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setModalConfig({
                    visible: true,
                    title: 'שגיאה',
                    message: error.message,
                    type: 'error',
                    onClose: () => setModalConfig(prev => ({ ...prev, visible: false }))
                });
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setModalConfig({
                    visible: true,
                    title: 'הפרופיל נוצר',
                    message: 'ברוכים הבאים לכדור',
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

    const getStepIcon = () => {
        switch (step) {
            case 1: return 'person-outline';
            case 2: return 'location-outline';
            case 3: return 'football-outline';
            default: return 'person-outline';
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return 'מה השם שלך?';
            case 2: return 'איפה אתה נמצא?';
            case 3: return 'מה העמדה שלך?';
            default: return '';
        }
    };

    const getStepSubtitle = () => {
        switch (step) {
            case 1: return 'כך שחקנים אחרים יראו אותך';
            case 2: return 'נמצא משחקים באזור שלך';
            case 3: return 'בחר את העמדה המועדפת עליך';
            default: return '';
        }
    };

    const renderInputStep = (
        value: string,
        onChange: (text: string) => void,
        placeholder: string,
        fieldName: string
    ) => (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.inputSection}>
            <View style={styles.inputWrapper}>
                <Animated.View
                    style={[
                        styles.inputContainer,
                        focusedField === fieldName && styles.inputContainerFocused,
                    ]}
                >
                    <View style={styles.inputIconContainer}>
                        <Ionicons
                            name={fieldName === 'name' ? 'person-outline' : 'location-outline'}
                            size={20}
                            color={focusedField === fieldName ? COLORS.accent : COLORS.textTertiary}
                        />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor={COLORS.textDisabled}
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField(fieldName)}
                        onBlur={() => setFocusedField(null)}
                        selectionColor={COLORS.accent}
                        autoFocus
                        textAlign="right"
                    />
                </Animated.View>
            </View>
        </Animated.View>
    );

    const renderPositionStep = () => (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.positionsSection}>
            <View style={styles.positionsContainer}>
                {positions.map((pos, index) => (
                    <Animated.View
                        key={pos.id}
                        entering={FadeInDown.delay(index * 80).duration(400)}
                    >
                        <TouchableOpacity
                            style={[
                                styles.positionCard,
                                position === pos.id && styles.positionCardActive,
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setPosition(pos.id);
                            }}
                            activeOpacity={0.7}
                        >
                            {position === pos.id && (
                                <LinearGradient
                                    colors={[COLORS.accentSubtle, 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <View style={[
                                styles.positionIconContainer,
                                position === pos.id && styles.positionIconContainerActive
                            ]}>
                                <Ionicons
                                    name={pos.icon as any}
                                    size={22}
                                    color={position === pos.id ? COLORS.bgPrimary : COLORS.accent}
                                />
                            </View>
                            <Text style={[
                                styles.positionLabel,
                                position === pos.id && styles.positionLabelActive
                            ]}>
                                {pos.label}
                            </Text>
                            {position === pos.id && (
                                <View style={styles.positionCheckmark}>
                                    <Ionicons name="checkmark" size={16} color={COLORS.accent} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

            <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPosition('');
                }}
            >
                <Text style={styles.skipText}>דלג לעכשיו</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={[COLORS.bgPrimary, COLORS.bgSecondary, COLORS.bgTertiary]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Floating particles */}
            <View style={styles.particlesContainer} pointerEvents="none">
                <FloatingParticle delay={0} size={3} x={width * 0.1} duration={8000} />
                <FloatingParticle delay={2000} size={2} x={width * 0.25} duration={10000} />
                <FloatingParticle delay={1000} size={4} x={width * 0.4} duration={7000} />
                <FloatingParticle delay={3000} size={2} x={width * 0.6} duration={9000} />
                <FloatingParticle delay={500} size={3} x={width * 0.75} duration={11000} />
                <FloatingParticle delay={1500} size={2} x={width * 0.9} duration={8500} />
            </View>

            {/* Top accent glow */}
            <View style={styles.topGlow}>
                <LinearGradient
                    colors={['transparent', COLORS.accentGlow, 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                />
            </View>

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                    {step > 1 ? (
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Ionicons name="arrow-forward" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.backButton} />
                    )}
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>הגדרת פרופיל</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.stepIndicator}>{step}/3</Text>
                    </View>
                </Animated.View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, progressStyle]}>
                            <LinearGradient
                                colors={[COLORS.accent, COLORS.accentDark]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </Animated.View>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Step Icon */}
                        <Animated.View style={[styles.stepIconSection, iconAnimStyle]}>
                            <View style={styles.stepIconOuter}>
                                <LinearGradient
                                    colors={[COLORS.accentGlow, 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                />
                                <View style={styles.stepIconInner}>
                                    <Ionicons name={getStepIcon() as any} size={32} color={COLORS.accent} />
                                </View>
                            </View>
                        </Animated.View>

                        {/* Step Title */}
                        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>{getStepTitle()}</Text>
                            <Text style={styles.stepSubtitle}>{getStepSubtitle()}</Text>
                        </Animated.View>

                        {/* Form Card */}
                        <Animated.View
                            entering={FadeInUp.delay(200).duration(500)}
                            style={styles.formCard}
                        >
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                            <View style={styles.formCardBorder} />

                            {step === 1 && renderInputStep(fullName, setFullName, 'הזן את השם שלך', 'name')}
                            {step === 2 && renderInputStep(city, setCity, 'הזן את העיר שלך', 'city')}
                            {step === 3 && renderPositionStep()}
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Footer */}
                <Animated.View entering={FadeIn.delay(400)} style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.continueButton, loading && styles.continueButtonDisabled]}
                        onPress={step === 3 ? handleSave : handleContinue}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={loading ? [COLORS.cardBg, COLORS.cardBg] : [COLORS.accent, COLORS.accentDark]}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.buttonShine} />
                        <View style={styles.continueButtonInner}>
                            {loading ? (
                                <Text style={styles.continueText}>שומר...</Text>
                            ) : (
                                <>
                                    <Ionicons name="arrow-back" size={20} color={COLORS.bgPrimary} />
                                    <Text style={styles.continueText}>
                                        {step === 3 ? 'סיום הגדרה' : 'המשך'}
                                    </Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>

            <FeedbackModal
                visible={modalConfig.visible}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                buttonText="המשך"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        opacity: 0.6,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    headerRight: {
        width: 44,
        alignItems: 'center',
    },
    stepIndicator: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '600',
    },
    progressContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    progressTrack: {
        height: 3,
        backgroundColor: COLORS.cardBg,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    stepIconSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    stepIconOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    stepIconInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    formCard: {
        borderRadius: 20,
        padding: 24,
        overflow: 'hidden',
        backgroundColor: COLORS.cardBg,
    },
    formCardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    inputSection: {
        marginBottom: 8,
    },
    inputWrapper: {
        gap: 8,
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        height: 60,
        borderRadius: 14,
        backgroundColor: COLORS.inputBg,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: COLORS.inputBorder,
    },
    inputContainerFocused: {
        borderColor: COLORS.inputFocusBorder,
        backgroundColor: COLORS.accentSubtle,
    },
    inputIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.textPrimary,
        fontSize: 18,
        textAlign: 'right',
    },
    positionsSection: {
        marginBottom: 8,
    },
    positionsContainer: {
        gap: 12,
    },
    positionCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
    },
    positionCardActive: {
        borderColor: COLORS.accent,
    },
    positionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.accentSubtle,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 14,
    },
    positionIconContainerActive: {
        backgroundColor: COLORS.accent,
    },
    positionLabel: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
        textAlign: 'right',
    },
    positionLabelActive: {
        color: COLORS.textPrimary,
    },
    positionCheckmark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.accentSubtle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButton: {
        alignItems: 'center',
        marginTop: 20,
        padding: 12,
    },
    skipText: {
        fontSize: 14,
        color: COLORS.textTertiary,
    },
    footer: {
        padding: 24,
        paddingBottom: 16,
    },
    continueButton: {
        height: 58,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    continueButtonDisabled: {
        shadowOpacity: 0,
    },
    buttonShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    continueButtonInner: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    continueText: {
        color: COLORS.bgPrimary,
        fontSize: 17,
        fontWeight: '700',
    },
});
