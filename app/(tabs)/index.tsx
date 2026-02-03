import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
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

  const QuickAction = ({
    icon,
    label,
    onPress,
    accent = COLORS.turfGreen,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    accent?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.quickAction, { borderColor: `${accent}22` }]}
    >
      <LinearGradient
        colors={[`${accent}1A`, 'rgba(255,255,255,0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.quickIcon, { backgroundColor: `${accent}1F` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderGameCard = ({ item, index }: { item: Game; index: number }) => {
    const spotsLeft = item.max_players - (item.current_players || 0);
    const isFilling = spotsLeft <= 3 && spotsLeft > 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/game/${item.id}`);
          }}
          activeOpacity={0.9}
        >
          <GlassCard style={styles.gameCard} variant="elevated">
            <View style={[styles.gameCardRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.timePill, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={styles.timeDate}>{formatDate(item.start_time)}</Text>
                <Text style={styles.timeHour}>{formatTime(item.start_time)}</Text>
              </View>

              <View style={[styles.gameMain, isRTL && { alignItems: 'flex-end' }]}>
                <View style={[styles.gameHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.gameTitle, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatText}>{item.format}</Text>
                  </View>
                </View>

                {item.description && (
                  <Text style={[styles.gameDescription, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.spotsBadge, isFilling && styles.spotsBadgeFilling]}>
                    <Ionicons
                      name="people"
                      size={14}
                      color={isFilling ? COLORS.accentOrange : COLORS.turfGreenLight}
                    />
                    <Text style={[styles.spotsText, isFilling && styles.spotsTextFilling]}>
                      {item.current_players || 0}/{item.max_players}
                    </Text>
                  </View>
                  {isFilling && (
                    <Text style={styles.fillingText}>{t('home.filling_fast')}</Text>
                  )}
                </View>

                {item.address && (
                  <View style={[styles.locationRow, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="location" size={12} color={COLORS.textTertiary} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.address.split(',')[0]}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardCtaRow}>
              <Text style={styles.cardCtaText}>{t('home.view_game') || 'צפו בפרטים'}</Text>
              <Ionicons
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={16}
                color={COLORS.textTertiary}
              />
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
        <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.headerLeft, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={[styles.brandName, isRTL && { textAlign: 'right' }]}>כדור</Text>
            <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>{t('home.welcome')}</Text>
          </View>
          {games.length > 0 && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-game');
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="add" size={26} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.quickRow}>
          <QuickAction
            icon="add-circle-outline"
            label={t('home.create_first_game')}
            onPress={() => router.push('/create-game')}
          />
          <QuickAction
            icon="compass-outline"
            label={t('tabs.explore')}
            onPress={() => router.push('/(tabs)/explore')}
            accent={COLORS.accentOrange}
          />
        </View>

        {/* Section Header */}
        {games.length > 0 && (
          <Animated.View
            entering={FadeInRight.delay(200)}
            style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}
          >
            <View style={[styles.sectionTitleContainer, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.sectionIcon}>
                <Ionicons name="flame" size={16} color={COLORS.accentOrange} />
              </View>
              <Text style={styles.sectionTitle}>{t('home.upcoming_games')}</Text>
            </View>
            <Text style={styles.gamesCount}>{games.length} {t('home.games_available')}</Text>
          </Animated.View>
        )}

        {/* Content */}
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
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.xs,
  },
  headerLeft: {
    flex: 1,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontFamily: FONTS.heading,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
    marginBottom: SPACING.m,
  },
  quickAction: {
    flex: 1,
    height: 64,
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONTS.body,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.s,
    backgroundColor: COLORS.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.s,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.heading,
  },
  gamesCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
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
  gameCardRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  timePill: {
    width: 88,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.s,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: 'rgba(10, 123, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  timeHour: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  gameMain: {
    flex: 1,
    gap: 8,
  },
  gameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: FONTS.heading,
  },
  formatBadge: {
    backgroundColor: 'rgba(0, 168, 107, 0.12)',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.s,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 107, 0.25)',
  },
  formatText: {
    color: COLORS.turfGreenLight,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    lineHeight: 20,
  },
  metaRow: {
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
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
  spotsTextFilling: {
    color: COLORS.accentOrange,
  },
  fillingText: {
    color: COLORS.accentOrange,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontFamily: FONTS.body,
    flex: 1,
  },
  cardCtaRow: {
    marginTop: SPACING.m,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardGlassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  cardCtaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.body,
    fontWeight: '600',
  },
});
