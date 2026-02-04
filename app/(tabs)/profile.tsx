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

// Apple-inspired color palette
const COLORS = {
  primary: '#34C759',
  primaryLight: '#30D158',

  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',

  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  quaternaryLabel: '#C7C7CC',

  separator: '#E5E5EA',
  systemGray6: '#F2F2F7',

  orange: '#FF9500',
  red: '#FF3B30',
  blue: '#007AFF',
  gold: '#FFD700',
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
      return 'היום';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'מחר';
    }
    return date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Text style={styles.headerTitle}>פרופיל</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile/edit');
              }}
            >
              <Ionicons name="settings-outline" size={22} color={COLORS.tertiaryLabel} />
            </TouchableOpacity>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary]}
                style={styles.avatarGradient}
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
                <Ionicons name="location-outline" size={14} color={COLORS.tertiaryLabel} />
                <Text style={styles.locationText}>{profile.city}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{history.length}</Text>
                <Text style={styles.statLabel}>משחקים</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.stats?.goals || 0}</Text>
                <Text style={styles.statLabel}>שערים</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.stats?.assists || 0}</Text>
                <Text style={styles.statLabel}>בישולים</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.mvpIcon}>
                  <Ionicons name="trophy" size={14} color={COLORS.gold} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.gold }]}>
                  {profile?.stats?.mvps || 0}
                </Text>
                <Text style={styles.statLabel}>MVP</Text>
              </View>
            </View>
          </Animated.View>

          {/* Games Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>המשחקים שלי</Text>

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
                <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                  קרובים
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
                    activeOpacity={0.7}
                  >
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
                      <View style={styles.gameMeta}>
                        <Ionicons name="calendar-outline" size={13} color={COLORS.tertiaryLabel} />
                        <Text style={styles.gameDate}>{formatDate(game.start_time)}</Text>
                      </View>
                    </View>
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatText}>{game.format}</Text>
                    </View>
                    <Ionicons name="chevron-back" size={16} color={COLORS.quaternaryLabel} />
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="football-outline" size={32} color={COLORS.tertiaryLabel} />
                </View>
                <Text style={styles.emptyText}>
                  {activeTab === 'upcoming' ? 'אין משחקים קרובים' : 'אין היסטוריית משחקים'}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Legal Links */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.legalSection}>
            <TouchableOpacity
              style={styles.legalButton}
              onPress={() => router.push('/legal/privacy')}
            >
              <Text style={styles.legalText}>מדיניות פרטיות</Text>
              <Ionicons name="chevron-back" size={16} color={COLORS.quaternaryLabel} />
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity
              style={styles.legalButton}
              onPress={() => router.push('/legal/terms')}
            >
              <Text style={styles.legalText}>תנאי שימוש</Text>
              <Ionicons name="chevron-back" size={16} color={COLORS.quaternaryLabel} />
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Out */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.signOutSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
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
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
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
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
  },
  statsContainer: {
    flexDirection: 'row-reverse',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.label,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.separator,
  },
  mvpIcon: {
    marginBottom: 2,
  },
  section: {
    backgroundColor: COLORS.background,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'right',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.systemGray6,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.tertiaryLabel,
  },
  tabTextActive: {
    color: COLORS.label,
    fontWeight: '600',
  },
  gameCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'right',
    marginBottom: 4,
  },
  gameMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  gameDate: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
  },
  formatBadge: {
    backgroundColor: COLORS.systemGray6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
  },
  legalSection: {
    backgroundColor: COLORS.background,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  legalButton: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  legalText: {
    fontSize: 16,
    color: COLORS.label,
  },
  legalSeparator: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginHorizontal: 16,
  },
  signOutSection: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  signOutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red,
  },
});
