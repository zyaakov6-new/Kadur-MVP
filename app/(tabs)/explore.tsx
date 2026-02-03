import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { CityDropdown } from '../../components/ui/CityDropdown';
import * as Haptics from 'expo-haptics';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
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
    fetchGames();
  };

  const filteredGames = games.filter(game => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = game.title.toLowerCase().includes(query);
      const descMatch = game.description?.toLowerCase().includes(query);
      if (!titleMatch && !descMatch) return false;
    }

    if (selectedFormat !== 'All' && game.format !== selectedFormat) return false;

    if (selectedDate !== 'All') {
      const gameDate = new Date(game.start_time);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (selectedDate === 'Today') {
        return gameDate.toDateString() === today.toDateString();
      } else if (selectedDate === 'Tomorrow') {
        return gameDate.toDateString() === tomorrow.toDateString();
      }
    }

    if (selectedCity !== 'All') {
      if (!game.address?.includes(selectedCity)) return false;
    }

    return true;
  });

  const uniqueCities = Array.from(new Set(games.map(g => {
    if (!g.address) return null;
    const parts = g.address.split(',');
    if (parts.length > 1) {
      let potentialCity = parts[parts.length - 1].trim();
      if (potentialCity.toLowerCase() === 'israel' || potentialCity.toLowerCase() === 'il') {
        if (parts.length > 2) {
          potentialCity = parts[parts.length - 2].trim();
        } else {
          potentialCity = parts[0].trim();
        }
      }
      return potentialCity;
    }
    return g.address.trim();
  }).filter(c => c && c.length > 0))) as string[];

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
          colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('common.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('common.tomorrow');
    }
    return date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderGameCard = ({ item, index }: { item: Game; index: number }) => {
    const spotsLeft = item.max_players - (item.current_players || 0);
    const isFilling = spotsLeft <= 3 && spotsLeft > 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/game/${item.id}`);
          }}
          activeOpacity={0.9}
        >
          <GlassCard style={styles.gameCard} variant="default">
            <View style={[styles.gameCardHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.gameInfoLeft, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={[styles.gameTitle, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.metaBadge, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="calendar" size={11} color={COLORS.turfGreenLight} />
                    <Text style={styles.metaText}>{formatDate(item.start_time)}</Text>
                  </View>
                  <View style={[styles.metaBadge, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="time" size={11} color={COLORS.turfGreenLight} />
                    <Text style={styles.metaText}>{formatTime(item.start_time)}</Text>
                  </View>
                </View>
                {item.address && (
                  <View style={[styles.locationRow, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="location" size={11} color={COLORS.textTertiary} />
                    <Text style={styles.locationText} numberOfLines={1}>{item.address.split(',')[0]}</Text>
                  </View>
                )}
              </View>
              <View style={styles.formatBadge}>
                <Text style={styles.formatText}>{item.format}</Text>
              </View>
            </View>

            {item.description && (
              <Text style={[styles.gameDescription, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                {item.description}
              </Text>
            )}

            <View style={styles.divider} />

            <View style={[styles.gameFooter, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.spotsBadge, isFilling && styles.spotsBadgeFilling]}>
                <Ionicons name="people" size={13} color={isFilling ? COLORS.accentOrange : COLORS.turfGreenLight} />
                <Text style={[styles.spotsText, isFilling && styles.spotsTextFilling]}>
                  {item.current_players || 0}/{item.max_players}
                </Text>
              </View>
              {isFilling && (
                <Text style={styles.fillingText}>{t('home.filling_fast')}</Text>
              )}
              <View style={{ flex: 1 }} />
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={COLORS.textTertiary} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>{t('explore.title')}</Text>
            <Text style={[styles.headerSubtitle, isRTL && { textAlign: 'right' }]}>{t('explore.subtitle')}</Text>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={18} color={COLORS.textTertiary} />
            </View>
            <TextInput
              style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
              placeholder={t('explore.search_placeholder')}
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={COLORS.turfGreenLight}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterContent, isRTL && { flexDirection: 'row-reverse' }]}
            >
              <FilterChip label={t('explore.filter_all')} selected={selectedFormat === 'All'} onPress={() => setSelectedFormat('All')} />
              <FilterChip label="5v5" selected={selectedFormat === '5v5'} onPress={() => setSelectedFormat('5v5')} />
              <FilterChip label="7v7" selected={selectedFormat === '7v7'} onPress={() => setSelectedFormat('7v7')} />
              <FilterChip label="11v11" selected={selectedFormat === '11v11'} onPress={() => setSelectedFormat('11v11')} />
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterContent, isRTL && { flexDirection: 'row-reverse' }]}
            >
              <FilterChip label={t('explore.filter_all')} selected={selectedDate === 'All'} onPress={() => setSelectedDate('All')} />
              <FilterChip label={t('explore.filter_today')} selected={selectedDate === 'Today'} onPress={() => setSelectedDate('Today')} />
              <FilterChip label={t('explore.filter_tomorrow')} selected={selectedDate === 'Tomorrow'} onPress={() => setSelectedDate('Tomorrow')} />
            </ScrollView>

            {uniqueCities.length > 0 && (
              <View style={[styles.cityFilterContainer, isRTL && { alignItems: 'flex-end' }]}>
                <CityDropdown
                  options={uniqueCities}
                  selectedOption={selectedCity}
                  onSelect={setSelectedCity}
                  label={t('explore.filter_city')}
                />
              </View>
            )}
          </View>

          {/* Results count */}
          <View style={[styles.resultsRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.resultsCount}>
              {filteredGames.length} {filteredGames.length === 1 ? t('explore.game_found') : t('explore.games_found')}
            </Text>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <LoadingState />
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
                tintColor={COLORS.turfGreenLight}
                colors={[COLORS.turfGreen]}
              />
            }
            renderItem={renderGameCard}
            ListEmptyComponent={
              <EmptyState
                icon="search-outline"
                title={t('common.no_results')}
                message={t('explore.try_changing_filters')}
              />
            }
          />
        )}
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
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
      color: COLORS.textPrimary,
    fontFamily: FONTS.heading,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONTS.body,
    marginTop: 2,
    marginBottom: SPACING.m,
  },
  searchContainer: {
    height: 50,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: SPACING.m,
  },
  searchIconContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
      color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  clearButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    marginBottom: SPACING.s,
  },
  filterContent: {
    gap: SPACING.s,
    paddingVertical: SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: SPACING.m,
    height: 34,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  filterChipSelected: {
    borderColor: COLORS.turfGreen,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  filterChipTextSelected: {
      color: COLORS.textPrimary,
  },
  cityFilterContainer: {
    marginTop: SPACING.s,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
    marginBottom: SPACING.xs,
  },
  resultsCount: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  listContent: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    paddingBottom: 120,
  },
  gameCard: {
    marginBottom: SPACING.m,
    padding: SPACING.m,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.s,
  },
  gameInfoLeft: {
    flex: 1,
    marginRight: SPACING.m,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '700',
      color: COLORS.textPrimary,
    fontFamily: FONTS.heading,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginTop: SPACING.xs,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.turfGreenLight,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: SPACING.xs,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontFamily: FONTS.body,
  },
  formatBadge: {
    backgroundColor: 'rgba(0, 168, 107, 0.12)',
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.s,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 107, 0.25)',
  },
  formatText: {
    color: COLORS.turfGreenLight,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    lineHeight: 18,
    marginBottom: SPACING.s,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: SPACING.s,
  },
  gameFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  spotsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xs,
  },
  spotsBadgeFilling: {
    backgroundColor: COLORS.warningLight,
  },
  spotsText: {
    color: COLORS.turfGreenLight,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
  spotsTextFilling: {
    color: COLORS.accentOrange,
  },
  fillingText: {
    color: COLORS.accentOrange,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
});
