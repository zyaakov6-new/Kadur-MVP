import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'open')
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

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
      return 'היום 🔥';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'מחר';
    }
    return date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
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

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
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

          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={13} color={COLORS.accent} />
                  <Text style={styles.metaText}>{formatTime(item.start_time)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={13} color={COLORS.accentBlue} />
                  <Text style={styles.metaText}>{formatDate(item.start_time)}</Text>
                </View>
              </View>
              {item.address && (
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={13} color={COLORS.textMuted} />
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

          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.playersInfo}>
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
              {isFilling && !isFull && (
                <Text style={styles.fillingBadge}>⚡ ממלא מהר</Text>
              )}
              {isFull && (
                <Text style={styles.fullBadge}>מלא</Text>
              )}
            </View>
            <Ionicons name="arrow-back-circle" size={24} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="search" size={40} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>לא נמצאו משחקים 🔍</Text>
      <Text style={styles.emptyMessage}>נסו לשנות את הפילטרים או לחפש משהו אחר</Text>
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
          <Text style={styles.headerTitle}>חיפוש 🔎</Text>
          <Text style={styles.headerSubtitle}>מצאו משחקים באזור שלכם</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="חיפוש משחק, מיקום..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={COLORS.primary}
              textAlign="right"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Format Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            <FilterChip label="הכל" selected={selectedFormat === 'הכל'} onPress={() => setSelectedFormat('הכל')} />
            <FilterChip label="5v5" selected={selectedFormat === '5v5'} onPress={() => setSelectedFormat('5v5')} />
            <FilterChip label="7v7" selected={selectedFormat === '7v7'} onPress={() => setSelectedFormat('7v7')} />
            <FilterChip label="11v11" selected={selectedFormat === '11v11'} onPress={() => setSelectedFormat('11v11')} />
          </ScrollView>

          {/* Date Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            <FilterChip label="הכל" selected={selectedDate === 'הכל'} onPress={() => setSelectedDate('הכל')} />
            <FilterChip label="היום" selected={selectedDate === 'היום'} onPress={() => setSelectedDate('היום')} />
            <FilterChip label="מחר" selected={selectedDate === 'מחר'} onPress={() => setSelectedDate('מחר')} />
          </ScrollView>

          <Text style={styles.resultsCount}>
            {filteredGames.length} {filteredGames.length === 1 ? 'משחק נמצא' : 'משחקים נמצאו'}
          </Text>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>מחפש משחקים...</Text>
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
    top: -50,
    left: -100,
    backgroundColor: COLORS.accentPurple,
    opacity: 0.08,
  },
  glowOrb2: {
    bottom: 100,
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
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'right',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingVertical: 6,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  filterChipSelected: {
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
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
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  gameCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: 14,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    textAlign: 'right',
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
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 10,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  playersInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
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
  fillingBadge: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  fullBadge: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
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
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  },
});
