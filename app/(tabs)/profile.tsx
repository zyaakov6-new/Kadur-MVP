import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Profile, Game } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { AchievementBadge } from '../../components/ui/AchievementBadge';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LoadingState } from '../../components/ui/LoadingState';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

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
    const { isRTL } = useLanguage();
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
            .maybeSingle();

        if (error) {
            console.error(error);
        } else {
            setProfile(data as any);
        }

        const { data: participations, error: partError } = await supabase
            .from('game_participants')
            .select('game_id, games(*)')
            .eq('user_id', session?.user.id);

        if (!partError && participations) {
            const games = participations.map((p: any) => p.games);
            setHistory(games);
        }

        const { data: allAchievements } = await supabase
            .from('achievements')
            .select('*')
            .order('xp', { ascending: true });

        if (allAchievements) {
            setAchievements(allAchievements as any);
        }

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
                end={{ x: 0.5, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Header */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassCard style={styles.profileHeader} variant="elevated">
                            <View style={[styles.headerTop, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={styles.avatarWrapper}>
                                    <LinearGradient
                                        colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
                                        style={styles.avatarGradient}
                                    >
                                        {profile?.avatar_url ? (
                                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                                        ) : (
                                            <Text style={styles.avatarText}>{profile?.full_name?.charAt(0) || '?'}</Text>
                                        )}
                                    </LinearGradient>
                                </View>

                                <View style={[styles.userInfo, isRTL && { alignItems: 'flex-end', marginRight: SPACING.m, marginLeft: 0 }]}>
                                    <Text style={[styles.userName, isRTL && { textAlign: 'right' }]}>{profile?.full_name}</Text>
                                    <View style={[styles.locationRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                        <Ionicons name="location" size={13} color={COLORS.textTertiary} />
                                        <Text style={styles.userCity}>{profile?.city || t('profile.no_city')}</Text>
                                    </View>
                                    <View style={styles.levelBadge}>
                                        <LinearGradient
                                            colors={[COLORS.successLight, 'rgba(52, 211, 153, 0.05)']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                        <Ionicons name="star" size={10} color={COLORS.turfGreenLight} />
                                        <Text style={styles.levelText}>{t('profile.level')} {Math.floor(totalXp / 500) + 1}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.settingsButton}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push('/profile/edit');
                                    }}
                                >
                                    <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Language Switcher */}
                            <View style={[styles.languageRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={[styles.languageLabelRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="globe-outline" size={16} color={COLORS.textTertiary} />
                                    <Text style={styles.languageLabel}>{t('profile.language')}</Text>
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
                                    <View style={styles.mvpBadge}>
                                        <Ionicons name="trophy" size={12} color={COLORS.accentGold} />
                                    </View>
                                    <Text style={[styles.statValue, { color: COLORS.accentGold }]}>{profile?.stats?.mvps || 0}</Text>
                                    <Text style={styles.statLabel}>{t('profile.mvps')}</Text>
                                </View>
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Trophy Cabinet */}
                    {achievements.length > 0 && (
                        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionContainer}>
                            <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={[styles.sectionTitleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Ionicons name="trophy" size={18} color={COLORS.accentGold} />
                                    <Text style={styles.sectionTitle}>{t('profile.trophy_cabinet')}</Text>
                                </View>
                                <Text style={styles.sectionSubtitle}>{userAchievements.size}/{achievements.length}</Text>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={[styles.badgesScroll, isRTL && { paddingLeft: SPACING.m, paddingRight: 0 }]}
                            >
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
                    )}

                    {/* Game History */}
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionContainer}>
                        <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                            <View style={[styles.sectionTitleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                <Ionicons name="football" size={18} color={COLORS.turfGreenLight} />
                                <Text style={styles.sectionTitle}>{t('profile.my_games')}</Text>
                            </View>
                        </View>

                        {/* Tabs */}
                        <View style={[styles.tabsContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveTab('upcoming');
                                }}
                            >
                                {activeTab === 'upcoming' && (
                                    <LinearGradient
                                        colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                                    {t('profile.upcoming')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveTab('past');
                                }}
                            >
                                {activeTab === 'past' && (
                                    <LinearGradient
                                        colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                                    {t('profile.past')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((game) => (
                                <TouchableOpacity
                                    key={game.id}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push(`/game/${game.id}`);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <GlassCard style={styles.gameCard} variant="subtle" noPadding>
                                        <View style={[styles.gameCardInner, isRTL && { flexDirection: 'row-reverse' }]}>
                                            <View style={[styles.gameMain, isRTL && { alignItems: 'flex-end' }]}>
                                                <Text style={[styles.gameTitle, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                                                    {game.title}
                                                </Text>
                                                <View style={[styles.gameMeta, isRTL && { flexDirection: 'row-reverse' }]}>
                                                    <Ionicons name="calendar" size={11} color={COLORS.textTertiary} />
                                                    <Text style={styles.gameDate}>
                                                        {new Date(game.start_time).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
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
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="football-outline" size={32} color={COLORS.textTertiary} />
                                <Text style={styles.emptyText}>{t('profile.no_games')}</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Legal */}
                    <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.legalSection}>
                        <View style={[styles.legalContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                            <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
                                <Text style={styles.legalLink}>{t('legal.privacy_policy')}</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalDivider}>|</Text>
                            <TouchableOpacity onPress={() => router.push('/legal/terms')}>
                                <Text style={styles.legalLink}>{t('legal.terms_of_service')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Logout */}
                    <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footer}>
                        <PremiumButton
                            title={t('auth.sign_out')}
                            onPress={handleSignOut}
                            variant="glass"
                            icon={<Ionicons name="log-out-outline" size={20} color={COLORS.error} />}
                            style={styles.signOutButton}
                            textStyle={styles.signOutText}
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
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: 120,
    },
    profileHeader: {
        marginBottom: SPACING.l,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    avatarWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        padding: 2,
        backgroundColor: COLORS.turfGreen + '30',
    },
    avatarGradient: {
        flex: 1,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
    },
    userInfo: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
        marginBottom: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
        gap: 4,
    },
    userCity: {
        color: COLORS.textTertiary,
        fontSize: 13,
        fontFamily: FONTS.body,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.s,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.xs,
        alignSelf: 'flex-start',
        overflow: 'hidden',
    },
    levelText: {
        color: COLORS.turfGreenLight,
        fontWeight: '700',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.s,
        backgroundColor: COLORS.inputBackground,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    languageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        marginTop: SPACING.s,
    },
    languageLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    languageLabel: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontFamily: FONTS.body,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        marginTop: SPACING.m,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
    },
    statLabel: {
        color: COLORS.textTertiary,
        fontSize: 10,
        textTransform: 'uppercase',
        fontFamily: FONTS.body,
        marginTop: 2,
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        height: '70%',
        alignSelf: 'center',
    },
    mvpBadge: {
        marginBottom: 2,
    },
    sectionContainer: {
        marginBottom: SPACING.l,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
    },
    sectionSubtitle: {
        color: COLORS.textTertiary,
        fontSize: 12,
        fontFamily: FONTS.body,
    },
    badgesScroll: {
        paddingRight: SPACING.m,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.m,
        backgroundColor: COLORS.inputBackground,
        borderRadius: BORDER_RADIUS.m,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.s,
        overflow: 'hidden',
    },
    activeTab: {},
    tabText: {
        color: COLORS.textTertiary,
        fontWeight: '600',
        fontSize: 13,
        fontFamily: FONTS.body,
    },
    activeTabText: {
        color: COLORS.textPrimary,
    },
    gameCard: {
        marginBottom: SPACING.s,
    },
    gameCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
    },
    gameMain: {
        flex: 1,
    },
    gameTitle: {
        fontWeight: '600',
        color: COLORS.textPrimary,
        fontSize: 15,
        marginBottom: 2,
        fontFamily: FONTS.heading,
    },
    gameMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    gameDate: {
        color: COLORS.textTertiary,
        fontSize: 11,
        fontFamily: FONTS.body,
    },
    formatBadge: {
        backgroundColor: COLORS.successLight,
        paddingHorizontal: SPACING.s,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.xs,
        marginHorizontal: SPACING.m,
    },
    formatText: {
        color: COLORS.turfGreenLight,
        fontWeight: '700',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: SPACING.xl,
        gap: SPACING.s,
    },
    emptyText: {
        color: COLORS.textTertiary,
        fontSize: 13,
        fontFamily: FONTS.body,
    },
    legalSection: {
        marginBottom: SPACING.m,
    },
    legalContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.m,
    },
    legalLink: {
        color: COLORS.textTertiary,
        fontSize: 12,
        fontFamily: FONTS.body,
    },
    legalDivider: {
        color: COLORS.textMuted,
    },
    footer: {
        marginBottom: SPACING.l,
    },
    signOutButton: {
        backgroundColor: COLORS.errorLight,
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.25)',
    },
    signOutText: {
        color: COLORS.error,
    },
});
