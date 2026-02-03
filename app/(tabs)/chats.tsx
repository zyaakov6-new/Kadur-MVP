import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet, TextInput, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';

export default function ChatsScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const [joinedGames, setJoinedGames] = useState<Game[]>([]);
    const [hiddenChats, setHiddenChats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const { session } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    // Refresh when screen comes into focus
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
            .from('participants')
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
        fetchJoinedGames();
    };

    const handleDeleteChat = (gameId: string) => {
        Alert.alert(
            t('chats.hide_chat'),
            t('chats.hide_chat_confirm'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('chats.hide_chat'),
                    style: "destructive",
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


    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.backgroundGradient as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('chats.title')}</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchPill, isRTL && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="search" size={20} color={COLORS.textTertiary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
                        <TextInput
                            style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
                            placeholder={t('explore.search_placeholder')}
                            placeholderTextColor={COLORS.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <View style={[styles.tabsContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                            {t('chats.active')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                        onPress={() => setActiveTab('past')}
                    >
                        <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                            {t('chats.past')}
                        </Text>
                    </TouchableOpacity>
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
                                <TouchableOpacity
                                    onPress={() => router.push(`/game/${item.id}/chat`)}
                                    onLongPress={() => handleDeleteChat(item.id)}
                                    style={styles.chatItem}
                                >
                                    <View style={[styles.chatItemContent, isRTL && { flexDirection: 'row-reverse' }]}>
                                        <View style={styles.avatarContainer}>
                                            <View style={styles.avatarInner}>
                                                <Ionicons name="people" size={24} color={COLORS.turfGreen} />
                                            </View>
                                        </View>

                                        <View style={[styles.chatMainInfo, isRTL ? { marginRight: SPACING.m } : { marginLeft: SPACING.m }]}>
                                            <Text style={[styles.chatName, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                            <Text style={[styles.chatPreviewText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                                                {t('chats.tap_to_view')}
                                            </Text>
                                        </View>

                                        <View style={[styles.chatMeta, isRTL && { alignItems: 'flex-start' }]}>
                                            <Text style={styles.chatTime}>
                                                {(item as any).last_activity ? new Date((item as any).last_activity).toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.separator} />
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <EmptyState
                                icon="chatbubbles-outline"
                                title={t('chats.no_chats')}
                                message={t('chats.no_chats_text')}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingTop: SPACING.l,
        paddingBottom: SPACING.s,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        display: 'none',
    },
    headerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        display: 'none',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        fontFamily: FONTS.heading,
        letterSpacing: -0.5,
        flex: 1,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    addButtonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        paddingHorizontal: SPACING.m,
        marginVertical: SPACING.m,
    },
    searchPill: {
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontFamily: FONTS.body,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.m,
        marginBottom: SPACING.m,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        color: COLORS.textTertiary,
        fontWeight: 'bold',
        fontSize: 14,
        fontFamily: FONTS.body,
    },
    activeTabText: {
        color: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 100,
    },
    chatItem: {
        paddingHorizontal: SPACING.m,
    },
    chatItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 2,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    chatMainInfo: {
        flex: 1,
    },
    chatName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        marginBottom: 4,
    },
    chatPreviewText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    chatTime: {
        fontSize: 12,
        color: COLORS.accentOrange,
        fontWeight: '600',
        marginBottom: 6,
    },
    unreadBadge: {
        backgroundColor: COLORS.accentOrange,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    unreadText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginLeft: 76,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        padding: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: FONTS.heading,
    },
    emptyText: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: FONTS.body,
    },
});
