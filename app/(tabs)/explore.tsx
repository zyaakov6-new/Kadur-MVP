import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

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
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardBg: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  inputBg: 'rgba(255, 255, 255, 0.06)',
  error: '#FF5252',
  warning: '#FF9800',
};

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('הכל');
  const [selectedDate, setSelectedDate] = useState('הכל');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [])
  );

  useEffect(() => {
    fetchGames();

    const channel = supabase
      .channel('games_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        fetchGames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'open')
        .gt('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        // Handle schema cache error or recursion error gracefully
        if (error.code === 'PGRST205' || error.code === '42P17' || error.message?.includes('schema cache') || error.message?.includes('recursion')) {
          console.log('Games table not ready or policy issue:', error.code);
          setGames([]);
        } else {
          console.error('Error fetching games:', error);
        }
      } else {
        setGames(data as any);
      }
    } catch (err) {
      console.error('Fetch games error:', err);
      setGames([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchGames();
  };

  const filteredGames = games.filter(game => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = game.title.toLowerCase().includes(query);
      const descMatch = game.description?.toLowerCase().includes(query);
      const addressMatch = game.address?.toLowerCase().includes(query);
      if (!titleMatch && !descMatch && !addressMatch) return false;
    }

    if (selectedFormat !== 'הכל' && game.format !== selectedFormat) return false;

    if (selectedDate !== 'הכל') {
      const gameDate = new Date(game.start_time);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (selectedDate === 'היום') {
        return gameDate.toDateString() === today.toDateString();
      } else if (selectedDate === 'מחר') {
        return gameDate.toDateString() === tomorrow.toDateString();
      }
    }

    return true;
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const FilterChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      {selected && (
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const GameCard = ({ item, index }: { item: Game; index: number }) => {
    const spotsLeft = item.max_players - (item.current_players || 0);
    const isFilling = spotsLeft <= 3 && spotsLeft > 0;
    const isFull = spotsLeft <= 0;
    const isGameToday = isToday(item.start_time);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
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

          <View style={styles.cardHeader}>
            <View style={styles.cardTitleArea}>
              <View style={styles.titleRow}>
                <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
                {isGameToday && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>היום</Text>
                  </View>
                )}
              </View>
              {item.address && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.address.split(',')[0]}
                  </Text>
                </View>
              )}
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

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={COLORS.accentBlue} />
              <Text style={styles.infoText}>{formatDate(item.start_time)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={COLORS.accentOrange} />
              <Text style={styles.infoText}>{formatTime(item.start_time)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons
                name="people"
                size={16}
                color={isFull ? COLORS.error : isFilling ? COLORS.warning : COLORS.primary}
              />
              <Text style={[
                styles.infoText,
                isFull && { color: COLORS.error },
                isFilling && { color: COLORS.warning },
                !isFull && !isFilling && { color: COLORS.primary },
              ]}>
                {item.current_players || 0}/{item.max_players}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.joinHint}>
              {isFull ? 'המשחק מלא' : isFilling ? `נשארו ${spotsLeft} מקומות` : 'לחצו להצטרפות'}
            </Text>
            <Ionicons name="arrow-back-circle" size={22} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="football-outline" size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>אין משחקים זמינים</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery || selectedFormat !== 'הכל' || selectedDate !== 'הכל'
          ? 'נסו לשנות את הפילטרים'
          : 'היו הראשונים ליצור משחק חדש'}
      </Text>
    </View>
  );

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
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>חיפוש משחקים</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="חפשו משחק, מיקום..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={COLORS.primary}
              textAlign="right"
            />
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Scrollable Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
            style={styles.filtersScroll}
          >
            <View style={styles.filterGroup}>
              <FilterChip label="הכל" selected={selectedFormat === 'הכל'} onPress={() => setSelectedFormat('הכל')} />
              <FilterChip label="5v5" selected={selectedFormat === '5v5'} onPress={() => setSelectedFormat('5v5')} />
              <FilterChip label="7v7" selected={selectedFormat === '7v7'} onPress={() => setSelectedFormat('7v7')} />
              <FilterChip label="11v11" selected={selectedFormat === '11v11'} onPress={() => setSelectedFormat('11v11')} />
            </View>
            <View style={styles.filterSeparator} />
            <View style={styles.filterGroup}>
              <FilterChip label="הכל" selected={selectedDate === 'הכל'} onPress={() => setSelectedDate('הכל')} />
              <FilterChip label="היום" selected={selectedDate === 'היום'} onPress={() => setSelectedDate('היום')} />
              <FilterChip label="מחר" selected={selectedDate === 'מחר'} onPress={() => setSelectedDate('מחר')} />
              <FilterChip label="השבוע" selected={selectedDate === 'השבוע'} onPress={() => setSelectedDate('השבוע')} />
            </View>
          </ScrollView>

          <Text style={styles.resultsCount}>
            {loading ? 'טוען...' : `${filteredGames.length} משחקים נמצאו`}
          </Text>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredGames}
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
            ListEmptyComponent={<EmptyState />}
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
    left: -100,
    backgroundColor: COLORS.accentPurple,
    opacity: 0.08,
  },
  glowOrb2: {
    bottom: 150,
    right: -100,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  searchIconContainer: {
    marginLeft: 8,
  },
  clearButton: {
    marginRight: 8,
  },
  filtersScroll: {
    marginBottom: 12,
  },
  filtersScrollContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingRight: 0,
  },
  filterGroup: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  filterSeparator: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  filterChipSelected: {
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextSelected: {
    color: COLORS.bgDark,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
  },
  gameCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleArea: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },
  locationRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'right',
    flex: 1,
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
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginBottom: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  infoDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 12,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
