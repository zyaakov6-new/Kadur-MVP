import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Profile, Game } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LoadingState } from '../../components/ui/LoadingState';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PublicProfileScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [history, setHistory] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle(); // Fix PGRST116

        if (error) {
            console.error(error);
        } else {
            setProfile(data as any);
        }

        const { data: participations, error: partError } = await supabase
            .from('participants')
            .select('game_id, games(*)')
            .eq('user_id', id);

        if (!partError && participations) {
            const games = participations.map((p: any) => p.games);
            setHistory(games);
        }

        setLoading(false);
    };

    if (loading) {
        return <LoadingState />;
    }

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
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassCard style={styles.profileHeader}>
                            <View style={[styles.headerTop, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={styles.avatarContainer}>
                                    {profile?.avatar_url ? (
                                        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                                    ) : (
                                        <Text style={styles.avatarText}>{profile?.full_name?.charAt(0)}</Text>
                                    )}
                                </View>
                                <View style={[styles.userInfo, isRTL && { alignItems: 'flex-end', marginLeft: SPACING.m, marginRight: 0 }]}>
                                    <Text style={styles.userName}>{profile?.full_name}</Text>
                                    <Text style={[styles.userCity, isRTL && { textAlign: 'right' }]}>{profile?.city || t('profile.no_city')} • {profile?.favorite_position || 'Player'}</Text>
                                </View>
                            </View>

                            {/* Stats Grid */}
                            <View style={[styles.statsGrid, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{history.length}</Text>
                                    <Text style={styles.statLabel}>{t('profile.games')}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{profile?.stats?.goals || 0}</Text>
                                    <Text style={styles.statLabel}>{t('profile.goals')}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{profile?.stats?.assists || 0}</Text>
                                    <Text style={styles.statLabel}>{t('profile.assists')}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{profile?.stats?.mvps || 0}</Text>
                                    <Text style={styles.statLabel}>{t('profile.mvps')}</Text>
                                </View>
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Game History */}
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('profile.recent_games')}</Text>

                        {history.map((game) => (
                            <GlassCard key={game.id} style={styles.gameCard} intensity={20}>
                                <View style={styles.gameCardContent}>
                                    <View style={[isRTL && { alignItems: 'flex-end' }]}>
                                        <Text style={[styles.gameTitle, isRTL && { textAlign: 'right' }]}>{game.title}</Text>
                                        <Text style={[styles.gameDate, isRTL && { textAlign: 'right' }]}>{new Date(game.start_time).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        game.status === 'open' ? styles.statusOpen : styles.statusClosed,
                                        isRTL ? { marginRight: SPACING.m } : { marginLeft: SPACING.m }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            game.status === 'open' ? styles.statusTextOpen : styles.statusTextClosed
                                        ]}>
                                            {t(`common.${game.status}`).toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </GlassCard>
                        ))}
                    </Animated.View>
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
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.s,
    },
    backButton: {
        borderRadius: 20,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    backButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: 100,
    },
    profileHeader: {
        padding: SPACING.l,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.l,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
        borderWidth: 2,
        borderColor: COLORS.accentOrange,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        marginBottom: 4,
    },
    userCity: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontFamily: FONTS.body,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        marginBottom: 4,
    },
    statLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textTransform: 'uppercase',
        fontFamily: FONTS.body,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        height: '80%',
        alignSelf: 'center',
    },
    sectionContainer: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        marginBottom: SPACING.m,
    },
    gameCard: {
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.l,
        marginBottom: SPACING.s,
    },
    gameCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gameTitle: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: 16,
        marginBottom: 4,
        fontFamily: FONTS.heading,
    },
    gameDate: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.s,
    },
    statusOpen: {
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
    },
    statusClosed: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusTextOpen: {
        color: '#4ade80',
    },
    statusTextClosed: {
        color: COLORS.textSecondary,
    },
});
