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
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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
      return 'היום';
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
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/game/${item.id}`);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.tertiaryLabel} />
                  <Text style={styles.metaText}>{formatDate(item.start_time)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color={COLORS.tertiaryLabel} />
                  <Text style={styles.metaText}>{formatTime(item.start_time)}</Text>
                </View>
              </View>
              {item.address && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={COLORS.tertiaryLabel} />
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
                <Text style={styles.fillingBadge}>ממלא מהר</Text>
              )}
              {isFull && (
                <Text style={styles.fullBadge}>מלא</Text>
              )}
            </View>
            <Ionicons name="chevron-back" size={16} color={COLORS.quaternaryLabel} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="search-outline" size={40} color={COLORS.tertiaryLabel} />
      </View>
      <Text style={styles.emptyTitle}>לא נמצאו משחקים</Text>
      <Text style={styles.emptyMessage}>נסו לשנות את הפילטרים או לחפש משהו אחר</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>חיפוש</Text>
          <Text style={styles.headerSubtitle}>מצאו משחקים באזור שלכם</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.tertiaryLabel} />
            <TextInput
              style={styles.searchInput}
              placeholder="חיפוש משחק, מיקום..."
              placeholderTextColor={COLORS.quaternaryLabel}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={COLORS.primary}
              textAlign="right"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.tertiaryLabel} />
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

          {/* Results count */}
          <Text style={styles.resultsCount}>
            {filteredGames.length} {filteredGames.length === 1 ? 'משחק נמצא' : 'משחקים נמצאו'}
          </Text>
        </Animated.View>

        {/* Content */}
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
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separator,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
    textAlign: 'right',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 44,
    backgroundColor: COLORS.systemGray6,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.label,
    textAlign: 'right',
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.systemGray6,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  filterChipTextSelected: {
    color: 'white',
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    textAlign: 'right',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  gameCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.separator,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    fontWeight: '600',
    color: COLORS.label,
    textAlign: 'right',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    flex: 1,
    textAlign: 'right',
  },
  formatBadge: {
    backgroundColor: COLORS.systemGray6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  formatBadgeFilling: {
    backgroundColor: '#FFF3E0',
  },
  formatBadgeFull: {
    backgroundColor: '#FFEBEE',
  },
  formatText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
  formatTextFilling: {
    color: COLORS.orange,
  },
  formatTextFull: {
    color: COLORS.red,
  },
  description: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  playersInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  playersText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  playersTextFilling: {
    color: COLORS.orange,
  },
  playersTextFull: {
    color: COLORS.red,
  },
  fillingBadge: {
    fontSize: 12,
    color: COLORS.orange,
    fontWeight: '500',
    marginRight: 4,
  },
  fullBadge: {
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
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.tertiaryLabel,
    textAlign: 'center',
  },
});
