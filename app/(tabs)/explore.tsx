import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { CityDropdown } from '../../components/ui/CityDropdown';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [activeTab])
  );

  useEffect(() => {
    fetchGames();

    // Subscribe to realtime updates for new games
    const channel = supabase
      .channel('games_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'games',
        },
        (payload) => {
          console.log('Game change detected:', payload);
          // Refetch games when any change occurs
          fetchGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const fetchGames = async () => {
    let query = supabase
      .from('games')
      .select('*');

    if (activeTab === 'upcoming') {
      query = query
        .eq('status', 'open')
        .gt('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
    } else {
      query = query
        .lt('start_time', new Date().toISOString())
        .order('start_time', { ascending: false });
    }

    const { data, error } = await query;

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
      // Check if address includes the selected city
      if (!game.address?.includes(selectedCity)) return false;
    }

    return true;
  });

  // Extract unique cities from games (upcoming only ideally, or all loaded games)
  const uniqueCities = Array.from(new Set(games.map(g => {
    if (!g.address) return null;
    const parts = g.address.split(',');
    if (parts.length > 1) {
      let potentialCity = parts[parts.length - 1].trim();
      // If last part is country (Israel), take the one before
      if (potentialCity.toLowerCase() === 'israel' || potentialCity.toLowerCase() === 'ישראל' || potentialCity.toLowerCase() === 'il') {
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

  const FilterChip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selected && styles.filterChipSelected
      ]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={[isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('explore.title')}</Text>
            <Text style={[styles.headerSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('explore.subtitle')}</Text>
          </View>

          <View style={[styles.searchContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="search" size={20} color={COLORS.textTertiary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
            <TextInput
              style={[
                styles.searchInput,
                isRTL && { textAlign: 'right' }
              ]}
              placeholder={t('explore.search_placeholder')}
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={COLORS.turfGreen}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingLeft: 8 }}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          </View>



          {/* Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={[
                styles.filterContent,
                isRTL && { flexDirection: 'row-reverse' },
                { flexGrow: 1 }
              ]}
            >
              <FilterChip label={t('explore.filter_all')} selected={selectedFormat === 'All'} onPress={() => setSelectedFormat('All')} />
              <FilterChip label="5v5" selected={selectedFormat === '5v5'} onPress={() => setSelectedFormat('5v5')} />
              <FilterChip label="7v7" selected={selectedFormat === '7v7'} onPress={() => setSelectedFormat('7v7')} />
              <FilterChip label="11v11" selected={selectedFormat === '11v11'} onPress={() => setSelectedFormat('11v11')} />
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={[
                styles.filterContent,
                isRTL && { flexDirection: 'row-reverse' },
                { flexGrow: 1 }
              ]}
            >
              <FilterChip label={t('explore.filter_all')} selected={selectedDate === 'All'} onPress={() => setSelectedDate('All')} />
              <FilterChip label={t('explore.filter_today')} selected={selectedDate === 'Today'} onPress={() => setSelectedDate('Today')} />
              <FilterChip label={t('explore.filter_tomorrow')} selected={selectedDate === 'Tomorrow'} onPress={() => setSelectedDate('Tomorrow')} />
            </ScrollView>

            {/* City Filter */}
            <View style={{ marginTop: 8, paddingHorizontal: isRTL ? 0 : 20, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <CityDropdown
                options={uniqueCities}
                selectedOption={selectedCity}
                onSelect={setSelectedCity}
                label={t('explore.filter_city')}
              />
            </View>

          </View>

        </View>
        {loading ? (
          <LoadingState />
        ) : (
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentOrange} />
            }
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <TouchableOpacity onPress={() => router.push(`/game/${item.id}`)}>
                  <GlassCard style={styles.gameCard} intensity={10}>
                    <View style={[styles.gameCardContent, isRTL && { alignItems: 'flex-end' }]}>
                      <View style={[styles.gameCardHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.gameInfoLeft, isRTL && { alignItems: 'flex-end' }]}>
                          <Text style={[styles.gameTitle, isRTL && { textAlign: 'right' }]}>{item.title}</Text>
                          <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                            <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.gameTime}>
                              {new Date(item.start_time).toLocaleDateString()} • {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                          {item.address && (
                            <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }, { marginTop: 4 }]}>
                              <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                              <Text style={styles.gameTime} numberOfLines={1}>{item.address}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.formatBadge}>
                          <Text style={styles.formatText}>{item.format}</Text>
                        </View>
                      </View>

                      <Text style={[styles.gameDescription, isRTL && { textAlign: 'right' }]} numberOfLines={1}>{item.description}</Text>

                      <View style={[styles.gameFooter, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.spotsContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                          <Ionicons name="people" size={16} color={COLORS.turfGreen} />
                          <Text style={[styles.spotsText, isRTL ? { marginRight: 6 } : { marginLeft: 6 }]}>
                            {item.max_players} {t('explore.spots_total')}
                          </Text>
                        </View>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={COLORS.textSecondary} />
                      </View>
                    </View>
                  </GlassCard>

                </TouchableOpacity>
              </Animated.View>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="football-outline"
                title={t('common.no_results')}
                message={t('explore.try_changing_filters')}
              />
            }
          />
        )}
      </SafeAreaView>
    </View >
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
    padding: SPACING.m,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.s,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.heading,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
    fontFamily: FONTS.body,
  },
  searchContainer: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },




  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: 'white',
    fontFamily: FONTS.body,
    paddingVertical: 0,
  },

  filtersContainer: {
    width: '100%',
  },
  filterScroll: {
    marginBottom: SPACING.s,
    width: '100%',
  },
  filterContent: {
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
    paddingVertical: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  filterChipSelected: {
    backgroundColor: COLORS.turfGreen,
    borderColor: COLORS.turfGreen,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextSelected: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  gameCard: {
    borderRadius: BORDER_RADIUS.l,
    marginBottom: SPACING.m,
    overflow: 'hidden',
  },
  gameCardContent: {
    padding: SPACING.m,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },

  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.s,
  },
  gameInfoLeft: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: FONTS.heading,
  },
  gameTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  formatBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 0,
    borderColor: 'transparent',
    alignSelf: 'flex-start',
  },
  formatText: {
    color: '#4AAF57',
    fontWeight: 'bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },



  gameDescription: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
    fontSize: 14,
    lineHeight: 20,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.s,
  },
  spotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotsText: {
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: SPACING.m,
  },
  emptySubtext: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginTop: 8,
  },
});
