import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Profile, Game } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Vibrant color palette
const COLORS = {
  primary: '#00D26A',
  primaryDark: '#00A855',
  primaryLight: '#00E676',

  bgDark: '#0A1A14',
  bgMid: '#0D2818',
  bgLight: '#14332A',

  accent: '#00FFB3',
  accentOrange: '#FF6B35',
  accentPurple: '#A855F7',
  accentBlue: '#38BDF8',
  accentYellow: '#FBBF24',
  gold: '#FFD700',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',

  cardBg: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',

  error: '#FF5252',
};

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<Game[]>([]);
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

    setLoading(false);
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.bgDark, COLORS.bgMid, COLORS.bgLight]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>טוען פרופיל...</Text>
      </View>
    );
  }

  const filteredHistory = history.filter(game => {
    const isPast = new Date(game.start_time) < new Date();
    return activeTab === 'past' ? isPast : !isPast;
  }).sort((a, b) => {
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'היום 🔥';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'מחר';
    }
    return date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bgDark, COLORS.bgMid, COLORS.bgLight]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.glowOrb, styles.glowOrb1]} />
      <View style={[styles.glowOrb, styles.glowOrb2]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Text style={styles.headerTitle}>פרופיל 👤</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile/edit');
              }}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.profileCard}>
            <LinearGradient
              colors={[COLORS.cardBg, 'rgba(255,255,255,0.04)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.primary, COLORS.primaryDark]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarText}>
                    {profile?.full_name?.charAt(0) || '?'}
                  </Text>
                )}
              </LinearGradient>
            </View>

            <Text style={styles.userName}>{profile?.full_name || 'שחקן'}</Text>

            {profile?.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={COLORS.accentBlue} />
                <Text style={styles.locationText}>{profile.city}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="football" size={20} color={COLORS.primary} style={styles.statIcon} />
                <Text style={styles.statValue}>{history.length}</Text>
                <Text style={styles.statLabel}>משחקים</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="flash" size={20} color={COLORS.accentOrange} style={styles.statIcon} />
                <Text style={[styles.statValue, { color: COLORS.accentOrange }]}>{profile?.stats?.goals || 0}</Text>
                <Text style={styles.statLabel}>שערים</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="hand-right" size={20} color={COLORS.accentBlue} style={styles.statIcon} />
                <Text style={[styles.statValue, { color: COLORS.accentBlue }]}>{profile?.stats?.assists || 0}</Text>
                <Text style={styles.statLabel}>בישולים</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={20} color={COLORS.gold} style={styles.statIcon} />
                <Text style={[styles.statValue, { color: COLORS.gold }]}>{profile?.stats?.mvps || 0}</Text>
                <Text style={styles.statLabel}>MVP</Text>
              </View>
            </View>
          </Animated.View>

          {/* Games Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>המשחקים שלי ⚽</Text>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab('upcoming');
                }}
                activeOpacity={0.7}
              >
                {activeTab === 'upcoming' && (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                  קרובים ⚡
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'past' && styles.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab('past');
                }}
                activeOpacity={0.7}
              >
                {activeTab === 'past' && (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                  היסטוריה
                </Text>
              </TouchableOpacity>
            </View>

            {/* Games List */}
            {filteredHistory.length > 0 ? (
              filteredHistory.map((game, index) => (
                <Animated.View
                  key={game.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <TouchableOpacity
                    style={styles.gameCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/game/${game.id}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
                      <View style={styles.gameMeta}>
                        <Ionicons name="calendar" size={14} color={COLORS.accentBlue} />
                        <Text style={styles.gameDate}>{formatDate(game.start_time)}</Text>
                      </View>
                    </View>
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatText}>{game.format}</Text>
                    </View>
                    <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="football-outline" size={40} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyText}>
                  {activeTab === 'upcoming' ? 'אין משחקים קרובים' : 'אין היסטוריית משחקים'}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Sign Out */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.signOutSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={styles.signOutText}>התנתקות</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowOrb1: {
    top: -50,
    right: -100,
    backgroundColor: COLORS.accentPurple,
    opacity: 0.08,
  },
  glowOrb2: {
    bottom: 200,
    left: -150,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.bgDark,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row-reverse',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.cardBorder,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.bgDark,
  },
  gameCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 4,
  },
  gameMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  gameDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  formatBadge: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 10,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  signOutSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  signOutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.2)',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
});
