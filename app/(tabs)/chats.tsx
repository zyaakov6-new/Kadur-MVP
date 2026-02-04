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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  blue: '#007AFF',
  red: '#FF3B30',
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
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/game/${item.id}/chat`);
        }}
        onLongPress={() => handleHideChat(item.id)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Ionicons name="chatbubbles" size={22} color={COLORS.primary} />
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
        <Ionicons name="chevron-back" size={16} color={COLORS.quaternaryLabel} />
      </TouchableOpacity>
    </Animated.View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={40} color={COLORS.tertiaryLabel} />
      </View>
      <Text style={styles.emptyTitle}>אין צ'אטים</Text>
      <Text style={styles.emptyMessage}>
        הצטרפו למשחק כדי להתחיל לשוחח עם שחקנים אחרים
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>צ'אטים</Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.tertiaryLabel} />
            <TextInput
              style={styles.searchInput}
              placeholder="חיפוש צ'אט..."
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
              <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                היסטוריה
              </Text>
            </TouchableOpacity>
          </View>
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
            renderItem={({ item, index }) => <ChatItem item={item} index={index} />}
            ListEmptyComponent={<EmptyState />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.systemGray6,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.tertiaryLabel,
  },
  tabTextActive: {
    color: COLORS.label,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContent: {
    flex: 1,
    marginRight: 12,
    marginLeft: 8,
  },
  chatHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.label,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
  },
  chatMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  formatBadge: {
    backgroundColor: COLORS.systemGray6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separator,
    marginRight: 62,
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
    lineHeight: 20,
  },
});
