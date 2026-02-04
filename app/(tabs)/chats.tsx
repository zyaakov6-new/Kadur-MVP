import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Vibrant color palette
const COLORS = {
  primary: '#00D26A',
  primaryDark: '#00A855',

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
};

export default function ChatsScreen() {
  const [joinedGames, setJoinedGames] = useState<Game[]>([]);
  const [hiddenChats, setHiddenChats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const { session } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        fetchJoinedGames();
      }
    }, [session])
  );

  useEffect(() => {
    if (session?.user) {
      fetchJoinedGames();
      loadHiddenChats();
    }
  }, [session]);

  const loadHiddenChats = async () => {
    try {
      const stored = await AsyncStorage.getItem('hidden_chats');
      if (stored) {
        setHiddenChats(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load hidden chats', e);
    }
  };

  const fetchJoinedGames = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        game_id,
        games:game_id (
          *,
          messages:messages (created_at)
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { foreignTable: 'games.messages', ascending: false })
      .limit(1, { foreignTable: 'games.messages' });

    if (error) {
      console.error('Error fetching chats:', error);
    } else {
      const games = data.map((item: any) => {
        const game = item.games;
        const lastMessage = game.messages?.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        return {
          ...game,
          last_activity: lastMessage ? lastMessage.created_at : game.created_at
        };
      }).filter((g: any) => g !== null);
      setJoinedGames(games);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchJoinedGames();
  };

  const handleHideChat = (gameId: string) => {
    Alert.alert(
      'הסתרת צ\'אט',
      'האם להסתיר את הצ\'אט הזה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הסתר',
          style: 'destructive',
          onPress: async () => {
            const newHidden = [...hiddenChats, gameId];
            setHiddenChats(newHidden);
            await AsyncStorage.setItem('hidden_chats', JSON.stringify(newHidden));
          }
        }
      ]
    );
  };

  const filteredGames = joinedGames.filter(game => {
    if (hiddenChats.includes(game.id)) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = game.title.toLowerCase().includes(query);
      if (!titleMatch) return false;
    }

    const gameDate = new Date(game.start_time);
    const now = new Date();

    if (activeTab === 'upcoming') {
      return gameDate > now;
    } else {
      return gameDate <= now;
    }
  }).sort((a, b) => {
    const timeA = new Date((a as any).last_activity || a.created_at).getTime();
    const timeB = new Date((b as any).last_activity || b.created_at).getTime();
    return timeB - timeA;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `לפני ${days} ימים`;
    } else if (hours > 0) {
      return `לפני ${hours} שעות`;
    } else if (minutes > 0) {
      return `לפני ${minutes} דקות`;
    } else {
      return 'עכשיו';
    }
  };

  const formatGameDate = (dateString: string) => {
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

  const ChatItem = ({ item, index }: { item: Game; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/game/${item.id}/chat`);
        }}
        onLongPress={() => handleHideChat(item.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.cardBg, 'rgba(255,255,255,0.04)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Avatar */}
        <View style={styles.avatar}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.primary]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="chatbubbles" size={20} color={COLORS.bgDark} />
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.chatTime}>
              {(item as any).last_activity ? formatTime((item as any).last_activity) : ''}
            </Text>
          </View>
          <View style={styles.chatMeta}>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>{item.format}</Text>
            </View>
            <Text style={styles.dateText}>{formatGameDate(item.start_time)}</Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>אין צ'אטים עדיין</Text>
      <Text style={styles.emptyMessage}>
        הצטרפו למשחק כדי להתחיל לשוחח עם שחקנים אחרים
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
          <Text style={styles.headerTitle}>צ'אטים</Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="חיפוש צ'אט..."
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
              {activeTab === 'upcoming' && (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                פעילים
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
              {activeTab === 'past' && (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                היסטוריה
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>טוען צ'אטים...</Text>
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
            renderItem={({ item, index }) => <ChatItem item={item} index={index} />}
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
    top: 100,
    right: -150,
    backgroundColor: COLORS.accentBlue,
    opacity: 0.08,
  },
  glowOrb2: {
    bottom: 50,
    left: -100,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'right',
    letterSpacing: 1,
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
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.bgDark,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chatContent: {
    flex: 1,
    marginRight: 14,
    marginLeft: 10,
  },
  chatHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chatMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  formatBadge: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
