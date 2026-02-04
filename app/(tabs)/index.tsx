import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
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

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',

  cardBg: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',

  error: '#FF5252',
  warning: '#FF9800',
  success: '#00E676',
};

export default function HomeScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      checkProfile();
      fetchGames();
    }, [session])
  );

  const checkProfile = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!error && !data) {
      router.replace('/(auth)/profile_setup');
    }
  };

  const fetchGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'open')
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20);

    if (error) {
      console.error(error);
    } else {
      setGames(data as any);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchGames();
  };

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const GameCard = ({ item, index }: { item: Game; index: number }) => {
    const spotsLeft = item.max_players - (item.current_players || 0);
    const isFilling = spotsLeft <= 3 && spotsLeft > 0;
    const isFull = spotsLeft <= 0;
    const isToday = new Date(item.start_time).toDateString() === new Date().toDateString();

    return (
      <Animated.View entering={FadeInDown.delay(index * 80).duration(500)}>
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/game/${item.id}`);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.cardBg, 'rgba(255,255,255,0.04)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Live indicator for today's games */}
          {isToday && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>היום</Text>
            </View>
          )}

          {/* Top Row */}
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={14} color={COLORS.accent} />
                  <Text style={styles.metaText}>{formatTime(item.start_time)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={14} color={COLORS.accentBlue} />
                  <Text style={styles.metaText}>{formatDate(item.start_time)}</Text>
                </View>
              </View>
            </View>

            <View style={[
              styles.formatBadge,
              isFull && styles.formatBadgeFull,
              isFilling && styles.formatBadgeFilling,
            ]}>
              <Text style={[
                styles.formatText,
                isFull && styles.formatTextFull,
                isFilling && styles.formatTextFilling,
              ]}>
                {item.format}
              </Text>
            </View>
          </View>

          {/* Location */}
          {item.address && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={COLORS.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.address.split(',')[0]}
              </Text>
            </View>
          )}

          {/* Bottom Row */}
          <View style={styles.cardBottom}>
            <View style={styles.playersContainer}>
              <View style={[
                styles.playersBadge,
                isFull && styles.playersBadgeFull,
                isFilling && styles.playersBadgeFilling,
              ]}>
                <Ionicons
                  name="people"
                  size={16}
                  color={isFull ? COLORS.error : isFilling ? COLORS.warning : COLORS.primary}
                />
                <Text style={[
                  styles.playersText,
                  isFull && styles.playersTextFull,
                  isFilling && styles.playersTextFilling,
                ]}>
                  {item.current_players || 0}/{item.max_players}
                </Text>
              </View>
              {isFilling && !isFull && (
                <Text style={styles.fillingText}>⚡ ממלא מהר!</Text>
              )}
              {isFull && (
                <Text style={styles.fullText}>מלא</Text>
              )}
            </View>

            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-back-circle" size={28} color={COLORS.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <Animated.View entering={FadeIn.delay(200)} style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="football" size={48} color="white" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>אין משחקים עדיין 😢</Text>
      <Text style={styles.emptyMessage}>
        היו הראשונים ליצור משחק באזור שלכם!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/create-game');
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.accent, COLORS.primary]}
          style={styles.emptyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add" size={22} color={COLORS.bgDark} />
          <Text style={styles.emptyButtonText}>יצירת משחק</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>טוען משחקים...</Text>
    </View>
  );

  const todayGamesCount = games.filter(g => {
    const date = new Date(g.start_time);
    return date.toDateString() === new Date().toDateString();
  }).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bgDark, COLORS.bgMid, COLORS.bgLight]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative orbs */}
      <View style={[styles.glowOrb, styles.glowOrb1]} />
      <View style={[styles.glowOrb, styles.glowOrb2]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>היי! 👋</Text>
              <Text style={styles.headerTitle}>כדור</Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-game');
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.accent, COLORS.primary]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="add" size={26} color={COLORS.bgDark} />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          {games.length > 0 && (
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <LinearGradient
                  colors={[COLORS.primary + '30', COLORS.primary + '10']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.statNumber}>{games.length}</Text>
                <Text style={styles.statLabel}>משחקים פתוחים</Text>
                <Ionicons name="football" size={20} color={COLORS.primary} style={styles.statIcon} />
              </View>
              <View style={[styles.statCard, styles.statCardAccent]}>
                <LinearGradient
                  colors={[COLORS.accentOrange + '30', COLORS.accentOrange + '10']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.statNumber, { color: COLORS.accentOrange }]}>{todayGamesCount}</Text>
                <Text style={styles.statLabel}>היום</Text>
                <Ionicons name="flame" size={20} color={COLORS.accentOrange} style={styles.statIcon} />
              </View>
            </View>
          )}
        </Animated.View>

        {/* Section Header */}
        {!loading && games.length > 0 && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>משחקים קרובים</Text>
              <Text style={styles.sectionEmoji}>⚽</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>הכל</Text>
              <Ionicons name="chevron-back" size={16} color={COLORS.accent} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : games.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
            renderItem={({ item, index }) => <GameCard item={item} index={index} />}
          />
        )}
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
    top: -100,
    right: -100,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  glowOrb2: {
    bottom: 200,
    left: -150,
    backgroundColor: COLORS.accentBlue,
    opacity: 0.08,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'right',
    letterSpacing: 1,
  },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  statCardPrimary: {},
  statCardAccent: {},
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statIcon: {
    position: 'absolute',
    top: 16,
    left: 16,
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  seeAllButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  gameCard: {
    borderRadius: 20,
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  formatBadge: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 106, 0.3)',
  },
  formatBadgeFilling: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  formatBadgeFull: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  formatText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  formatTextFilling: {
    color: COLORS.warning,
  },
  formatTextFull: {
    color: COLORS.error,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  cardBottom: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  playersContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  playersBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  playersBadgeFilling: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  playersBadgeFull: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  playersText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  playersTextFilling: {
    color: COLORS.warning,
  },
  playersTextFull: {
    color: COLORS.error,
  },
  fillingText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  fullText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
  arrowContainer: {
    opacity: 0.8,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  emptyButtonGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.bgDark,
  },
});
