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

// Apple-inspired color palette
const COLORS = {
  primary: '#34C759',
  primaryDark: '#248A3D',
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
      return 'היום';
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

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/game/${item.id}`);
          }}
          activeOpacity={0.7}
        >
          {/* Date/Time Column */}
          <View style={styles.dateColumn}>
            <Text style={styles.dateText}>{formatDate(item.start_time)}</Text>
            <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
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

            {item.address && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.tertiaryLabel} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.address.split(',')[0]}
                </Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <View style={styles.playersInfo}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={isFull ? COLORS.red : isFilling ? COLORS.orange : COLORS.primary}
                />
                <Text style={[
                  styles.playersText,
                  isFull && styles.playersTextFull,
                  isFilling && styles.playersTextFilling,
                ]}>
                  {item.current_players || 0}/{item.max_players}
                </Text>
                {isFilling && !isFull && (
                  <Text style={styles.fillingText}>נשארו {spotsLeft} מקומות</Text>
                )}
                {isFull && (
                  <Text style={styles.fullText}>מלא</Text>
                )}
              </View>
              <Ionicons name="chevron-back" size={16} color={COLORS.quaternaryLabel} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <Animated.View entering={FadeIn.delay(200)} style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="football-outline" size={48} color={COLORS.tertiaryLabel} />
      </View>
      <Text style={styles.emptyTitle}>אין משחקים קרובים</Text>
      <Text style={styles.emptyMessage}>
        היו הראשונים ליצור משחק באזור שלכם
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/create-game');
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.emptyButtonText}>יצירת משחק</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>שלום</Text>
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
                colors={[COLORS.primaryLight, COLORS.primary]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          {games.length > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{games.length}</Text>
                <Text style={styles.statLabel}>משחקים פתוחים</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {games.filter(g => {
                    const date = new Date(g.start_time);
                    return date.toDateString() === new Date().toDateString();
                  }).length}
                </Text>
                <Text style={styles.statLabel}>היום</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Section Header */}
        {!loading && games.length > 0 && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>משחקים קרובים</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>הכל</Text>
              <Ionicons name="chevron-back" size={14} color={COLORS.primary} />
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
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    marginTop: 16,
    backgroundColor: COLORS.systemGray6,
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.separator,
    marginHorizontal: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.label,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
  },
  seeAllButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  gameCard: {
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.separator,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateColumn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 2,
  },
  cardDivider: {
    width: 1,
    backgroundColor: COLORS.separator,
    marginHorizontal: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  formatBadge: {
    backgroundColor: COLORS.systemGray6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatBadgeFilling: {
    backgroundColor: '#FFF3E0',
  },
  formatBadgeFull: {
    backgroundColor: '#FFEBEE',
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  formatTextFilling: {
    color: COLORS.orange,
  },
  formatTextFull: {
    color: COLORS.red,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playersInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  playersText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },
  playersTextFilling: {
    color: COLORS.orange,
  },
  playersTextFull: {
    color: COLORS.red,
  },
  fillingText: {
    fontSize: 12,
    color: COLORS.orange,
    fontWeight: '500',
    marginRight: 4,
  },
  fullText: {
    fontSize: 12,
    color: COLORS.red,
    fontWeight: '500',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
