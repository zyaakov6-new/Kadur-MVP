import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Image } from 'expo-image';
import { LoadingState } from '../../components/ui/LoadingState';
import { FeedbackModal, AlertState } from '../../components/ui/FeedbackModal';

export default function EditProfileScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { session } = useAuth();
    const router = useRouter();
    const confettiRef = useRef<ConfettiCannon>(null);
    const { pickImage, uploadImage, uploading: imageUploading } = useImageUpload();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorAlert, setErrorAlert] = useState<AlertState>({ visible: false, title: '', message: '' });

    const [fullName, setFullName] = useState('');
    const [position, setPosition] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const positions = ['forward', 'midfielder', 'defender', 'goalkeeper'];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            if (!session?.user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle(); // Fix PGRST116

            if (error) throw error;

            if (data) {
                setFullName(data.full_name || '');
                setPosition(data.position || '');
                setBio(data.bio || '');
                setAvatarUrl(data.avatar_url);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setErrorAlert({
                visible: true,
                title: t('common.error'),
                message: t('profile_edit.error_load') || 'Failed to load profile',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImagePick = async () => {
        const result = await pickImage();
        if (result) {
            try {
                if (!session?.user) return;
                const publicUrl = await uploadImage(result.base64!, session.user.id);
                setAvatarUrl(publicUrl);
            } catch (error) {
                setErrorAlert({
                    visible: true,
                    title: t('common.error'),
                    message: t('profile_edit.error_upload_image') || 'Failed to upload image',
                    type: 'error'
                });
            }
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            setErrorAlert({
                visible: true,
                title: t('common.error'),
                message: t('profile_edit.error_name_required') || 'Name is required',
                type: 'warning'
            });
            return;
        }

        setSaving(true);
        try {
            if (!session?.user) return;

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    position,
                    bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date(),
                })
                .eq('id', session.user.id);

            if (error) throw error;

            setShowSuccessModal(true);
            confettiRef.current?.start();
            setTimeout(() => {
                setShowSuccessModal(false);
                router.back();
            }, 2000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setErrorAlert({
                visible: true,
                title: t('common.error'),
                message: t('profile_edit.error_update') || 'Failed to update profile',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    return (
        <View style={styles.container}>
            {saving && <LoadingState message={t('common.saving')} />}
            <LinearGradient
                colors={['#050B08', '#00261A', '#004D33']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { justifyContent: 'center' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { position: 'absolute', left: SPACING.m }]}>
                        <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
                            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
                        </BlurView>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile_edit.title')}</Text>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassCard style={styles.formCard}>
                            {/* Avatar section */}
                            <View style={styles.avatarSection}>
                                <TouchableOpacity onPress={handleImagePick} disabled={imageUploading}>
                                    <View style={styles.avatarContainer}>
                                        <LinearGradient
                                            colors={[COLORS.accentOrange, COLORS.turfGreen]}
                                            style={styles.avatarGlow}
                                        />
                                        {avatarUrl ? (
                                            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Ionicons name="person" size={40} color={COLORS.textTertiary} />
                                            </View>
                                        )}
                                        <View style={styles.cameraIconContainer}>
                                            {imageUploading ? (
                                                <LoadingState fullScreen={false} size={20} />
                                            ) : (
                                                <Ionicons name="camera" size={20} color="white" />
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.avatarHint}>{t('profile_edit.change_photo')}</Text>
                            </View>

                            {/* Full Name */}
                            <View style={[styles.inputGroup, { alignItems: 'center' }]}>
                                <Text style={[styles.label, { textAlign: 'center' }]}>{t('profile_edit.label_name')}</Text>
                                <TextInput
                                    style={[styles.input, { textAlign: 'center' }]}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder={t('profile_edit.label_name')}
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                            </View>

                            {/* Position selection */}
                            <View style={[styles.inputGroup, { alignItems: 'center' }]}>
                                <Text style={[styles.label, { textAlign: 'center' }]}>{t('profile_edit.label_position')}</Text>
                                <View style={[styles.positionGrid, { justifyContent: 'center' }]}>
                                    {positions.map((pos) => (
                                        <TouchableOpacity
                                            key={pos}
                                            style={[
                                                styles.positionItem,
                                                position === pos && styles.positionItemActive,
                                                position === pos && { borderColor: COLORS.turfGreen }
                                            ]}
                                            onPress={() => setPosition(pos)}
                                        >
                                            <Text style={[
                                                styles.positionName,
                                                position === pos && styles.positionNameActive
                                            ]}>
                                                {t(`profile_edit.positions.${pos}`)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Bio */}
                            <View style={[styles.inputGroup, { alignItems: 'center' }]}>
                                <Text style={[styles.label, { textAlign: 'center' }]}>{t('profile_edit.label_bio')}</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { textAlign: 'center' }]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder={t('profile_edit.label_bio')}
                                    placeholderTextColor={COLORS.textTertiary}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <PremiumButton
                                title={t('profile_edit.save')}
                                onPress={handleSave}
                                disabled={saving}
                                loading={saving}
                                style={styles.saveButton}
                            />
                        </GlassCard>
                    </Animated.View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            <FeedbackModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.back();
                }}
                title={t('common.success')}
                message={t('profile_edit.success_update')}
                buttonText={t('common.done')}
            />

            <FeedbackModal
                visible={errorAlert.visible}
                onClose={() => setErrorAlert({ ...errorAlert, visible: false })}
                title={errorAlert.title}
                message={errorAlert.message}
                buttonText={t('common.ok')}
                type={errorAlert.type || 'error'}
            />
            <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} autoStart={false} ref={confettiRef} fadeOut={true} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: SPACING.m,
    },
    formCard: {
        padding: SPACING.l,
        borderRadius: BORDER_RADIUS.xl,
        marginTop: SPACING.m,
    },
    inputGroup: {
        marginBottom: SPACING.l,
    },
    label: {
        color: COLORS.turfGreen,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    input: {
        backgroundColor: 'transparent',
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        color: 'white',
        fontSize: 16,
        borderWidth: 0,
        borderColor: 'transparent',
        width: '100%',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    positionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    positionItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BORDER_RADIUS.m,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        minWidth: '48%',
        alignItems: 'center',
    },
    positionItemActive: {
        backgroundColor: COLORS.turfGreen,
    },
    positionName: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    positionNameActive: {
        color: 'white',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 60,
        opacity: 0.2,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: COLORS.turfGreen,
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,
        borderColor: 'transparent',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.darkBackground,
    },
    avatarHint: {
        color: COLORS.accentOrange,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },
    saveButton: {
        marginTop: SPACING.m,
    },
    successButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.heading,
    },
});
