import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  // Refresh when screen comes into focus
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
      // Profile doesn't exist, redirect to setup
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
      .limit(10);

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050B08', '#00261A', '#004D33']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>KADUR</Text>
            <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.welcome')}</Text>
          </View>
          {games.length > 0 && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-game')}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}

        </View>

        {loading ? (
          <LoadingState />
        ) : games.length === 0 ? (
          <EmptyState
            icon="football-outline"
            title={t('home.no_games')}
            message={t('home.create_first_game_desc') || 'Be the first to organize a match in your area!'}
            buttonTitle={t('home.create_first_game')}
            onButtonPress={() => router.push('/create-game')}
            buttonIcon="add-circle"
          />
        ) : (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentOrange} />
            }
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <TouchableOpacity onPress={() => router.push(`/game/${item.id}`)}>
                  <GlassCard style={styles.gameCard}>
                    <View style={[styles.gameCardHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.gameInfoLeft, isRTL && { alignItems: 'flex-end' }]}>
                        <Text style={styles.gameTitle}>{item.title}</Text>
                        <Text style={styles.gameTime}>
                          <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} /> {item.start_time ? new Date(item.start_time).toLocaleDateString(isRTL ? 'he-IL' : 'en-US') : ''} • {item.start_time ? new Date(item.start_time).toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                      <View style={styles.formatBadge}>
                        <Text style={styles.formatText}>{item.format}</Text>
                      </View>
                    </View>

                    <Text style={[styles.gameDescription, isRTL && { textAlign: 'right' }]} numberOfLines={2}>{item.description}</Text>

                    <View style={[styles.gameFooter, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.spotsContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="people" size={16} color={COLORS.turfGreen} />
                        <Text style={styles.spotsText}>{item.current_players || 0}/{item.max_players}</Text>
                      </View>
                      {item.address && (
                        <View style={[styles.locationContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.locationText} numberOfLines={1}>{item.address}</Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </Animated.View>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.heading,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: COLORS.turfGreen,
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: FONTS.heading,
    marginTop: SPACING.l,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontFamily: FONTS.body,
    marginTop: SPACING.s,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74, 175, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 175, 87, 0.2)',
  },
  createFirstButton: {
    width: '100%',
    height: 56,
  },

  listContent: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  gameCard: {
    padding: SPACING.m,
    marginBottom: SPACING.m,
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.heading,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.heading,
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
  },
  formatBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: SPACING.s,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  formatText: {
    color: '#4AAF57',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: FONTS.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },




  gameDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    marginBottom: SPACING.s,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spotsText: {
    color: COLORS.turfGreen,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginLeft: SPACING.m,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.body,
    flex: 1,
  },
});
