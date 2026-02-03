import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Profile, Game } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { AchievementBadge } from '../../components/ui/AchievementBadge';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { ShareButton } from '../../components/ui/ShareButton'; // Optional, but good to have
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LoadingState } from '../../components/ui/LoadingState';


import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

type Achievement = {
    id: string;
    code: string;
    title: string;
    description: string;
    icon: string;
    xp: number;
};

export default function ProfileScreen() {
    const { session } = useAuth();
    const { t } = useTranslation();
    const { language, changeLanguage, isRTL } = useLanguage();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [history, setHistory] = useState<Game[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session?.user.id)
            .maybeSingle(); // Use maybeSingle to avoid PGRST116 if profile doesn't exist yet

        if (error) {
            console.error(error);
        } else {
            setProfile(data as any);
        }

        // Fetch games joined
        const { data: participations, error: partError } = await supabase
            .from('participants')
            .select('game_id, games(*)')
            .eq('user_id', session?.user.id);

        if (!partError && participations) {
            const games = participations.map((p: any) => p.games);
            setHistory(games);
        }

        // Fetch all achievements
        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('*')
            .order('xp', { ascending: true });

        if (allAchievements) {
            setAchievements(allAchievements as any);
        }

        // Fetch user achievements
        const { data: myAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', session?.user.id);

        if (myAchievements) {
            const unlocked = new Set(myAchievements.map((ua: any) => ua.achievement_id));
            setUserAchievements(unlocked);
        }

        setLoading(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
    };

    if (loading) {
        return <LoadingState />;
    }

    const totalXp = achievements
        .filter(a => userAchievements.has(a.id))
        .reduce((sum, a) => sum + a.xp, 0);

    const filteredHistory = history.filter(game => {
        const isPast = new Date(game.start_time) < new Date();
        return activeTab === 'past' ? isPast : !isPast;
    }).sort((a, b) => {
        const dateA = new Date(a.start_time).getTime();
        const dateB = new Date(b.start_time).getTime();
        return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.backgroundGradient as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassCard style={styles.profileHeader} intensity={25}>
                            <View style={[styles.headerTop, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={[styles.avatarContainer, { borderColor: COLORS.turfGreen }]}>
                                    {profile?.avatar_url ? (
                                        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                                    ) : (
                                        <Text style={styles.avatarText}>{profile?.full_name?.charAt(0)}</Text>
                                    )}
                                </View>
                                <View style={[styles.userInfo, isRTL && { alignItems: 'flex-end', marginRight: SPACING.m, marginLeft: 0 }]}>
                                    <Text style={styles.userName}>{profile?.full_name}</Text>
                                    <View style={[styles.locationRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                        <Ionicons name="location-outline" size={14} color={COLORS.textTertiary} />
                                        <Text style={styles.userCity}>{profile?.city || 'No city set'}</Text>
                                    </View>
                                    <View style={styles.levelBadge}>
                                        <Text style={styles.levelText}>{t('profile.level')} {Math.floor(totalXp / 500) + 1}</Text>
                                    </View>
                                </View>
                                <View style={styles.headerActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => router.push('/profile/edit')}
                                    >
                                        <Ionicons name="settings-outline" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>


                            {/* Language Switcher */}
                            <View style={[styles.languageRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="globe-outline" size={18} color={COLORS.textTertiary} />
                                    <Text style={[styles.languageLabel, isRTL ? { marginRight: 8 } : { marginLeft: 8 }]}>{t('profile.language')}</Text>
                                </View>
                                <LanguageSwitcher />
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

                    {/* Trophy Cabinet */}
                    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionContainer}>
                        <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                            <Text style={styles.sectionTitle}>{t('profile.trophy_cabinet')}</Text>
                            <Text style={styles.sectionSubtitle}>{userAchievements.size}/{achievements.length} {t('profile.unlocked')}</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.badgesScroll, isRTL && { paddingLeft: SPACING.m, paddingRight: 0 }]}>
                            {achievements.map((achievement, index) => (
                                <AchievementBadge
                                    key={achievement.id}
                                    title={achievement.title}
                                    description={achievement.description}
                                    icon={achievement.icon}
                                    xp={achievement.xp}
                                    locked={!userAchievements.has(achievement.id)}
                                    index={index}
                                />
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* Game History */}
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('profile.my_games')}</Text>

                        {/* Tabs */}
                        <View style={[styles.tabsContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                                onPress={() => setActiveTab('upcoming')}
                            >
                                <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>{t('profile.upcoming')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                                onPress={() => setActiveTab('past')}
                            >
                                <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>{t('profile.past')}</Text>
                            </TouchableOpacity>
                        </View>

                        {filteredHistory.map((game, index) => (
                            <TouchableOpacity
                                key={game.id}
                                onPress={() => router.push(`/game/${game.id}`)}
                            >
                                <GlassCard style={styles.gameCard} intensity={10} noPadding>
                                    <View style={[styles.gameCardInner, isRTL && { flexDirection: 'row-reverse' }]}>
                                        <View style={[styles.gameMain, isRTL && { alignItems: 'flex-end' }]}>
                                            <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
                                            <View style={[styles.gameMeta, isRTL && { flexDirection: 'row-reverse' }]}>
                                                <Ionicons name="calendar-outline" size={12} color={COLORS.textTertiary} />
                                                <Text style={styles.gameDate}>
                                                    {new Date(game.start_time).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.formatBadge}>
                                            <Text style={styles.formatText}>{game.format}</Text>
                                        </View>

                                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={COLORS.textTertiary} />
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}

                        {filteredHistory.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{t('profile.no_games')}</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Legal Section */}
                    <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.sectionContainer}>
                        <View style={[styles.legalContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
                                <Text style={styles.legalLink}>{t('legal.privacy_policy')}</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalDivider}>•</Text>
                            <TouchableOpacity onPress={() => router.push('/legal/terms')}>
                                <Text style={styles.legalLink}>{t('legal.terms_of_service')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Logout Button */}
                    <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footer}>
                        <PremiumButton
                            title={t('auth.sign_out')}
                            onPress={handleSignOut}
                            variant="glass"
                            style={styles.signOutButton}
                            textStyle={styles.signOutText}
                            icon={<Ionicons name="log-out-outline" size={20} color="#ef4444" />}
                        />
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
        marginBottom: SPACING.l,
    },

    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
        borderWidth: 0,
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
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userCity: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginLeft: 4,
        marginRight: 4,
        fontFamily: FONTS.body,
    },
    levelBadge: {
        backgroundColor: 'transparent',
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.s,
        alignSelf: 'flex-start',
        borderWidth: 0,
    },
    levelText: {
        color: COLORS.turfGreen,
        fontWeight: 'bold',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerActions: {
        alignSelf: 'flex-start',
    },
    actionButton: {
        padding: 8,
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
    },
    sectionSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    badgesScroll: {
        paddingRight: SPACING.m,
    },
    gameCard: {
        marginBottom: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
    },
    gameCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
    },
    gameMain: {
        flex: 1,
    },
    gameMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    formatBadge: {
        backgroundColor: 'transparent',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 0,
        marginHorizontal: 12,
    },
    formatText: {
        color: '#4AAF57',
        fontWeight: 'bold',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
        backgroundColor: 'transparent',
    },
    statusClosed: {
        backgroundColor: 'transparent',
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
    emptyContainer: {
        alignItems: 'center',
        padding: SPACING.l,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    footer: {
        marginBottom: SPACING.xl,
    },
    signOutButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1,
        height: 56,
    },

    signOutText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.m,
        backgroundColor: 'transparent',
        borderRadius: BORDER_RADIUS.m,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.s,
    },
    activeTab: {
        backgroundColor: 'rgba(74, 175, 87, 0.15)',
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeTabText: {
        color: 'white',
    },
    languageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        marginTop: SPACING.m,
    },
    languageLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontFamily: FONTS.body,
    },
    languageToggle: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        borderRadius: BORDER_RADIUS.m,
        padding: 4,
    },
    langButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: BORDER_RADIUS.s,
    },
    activeLangButton: {
        backgroundColor: 'rgba(74, 175, 87, 0.15)',
    },
    langText: {
        color: COLORS.textTertiary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeLangText: {
        color: 'white',
    },

    legalContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    legalLink: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    legalDivider: {
        color: COLORS.textSecondary,
        marginHorizontal: 8,
    },
    editButton: {
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    editButtonGradient: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
