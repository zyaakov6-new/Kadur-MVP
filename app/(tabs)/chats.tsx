import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Game } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';

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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return date.toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        }
    };

    const renderChatItem = ({ item, index }: { item: Game; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <TouchableOpacity
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/game/${item.id}/chat`);
                }}
                onLongPress={() => handleDeleteChat(item.id)}
                activeOpacity={0.8}
            >
                <GlassCard style={styles.chatCard} variant="subtle" noPadding>
                    <View style={[styles.chatItemContent, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={[COLORS.turfGreenLight + '30', COLORS.turfGreen + '20']}
                                style={styles.avatarGradient}
                            >
                                <Ionicons name="chatbubbles" size={22} color={COLORS.turfGreenLight} />
                            </LinearGradient>
                        </View>

                        <View style={[styles.chatMainInfo, isRTL && { alignItems: 'flex-end', marginRight: SPACING.m, marginLeft: 0 }]}>
                            <Text style={[styles.chatName, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <View style={[styles.chatPreviewRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={[styles.formatMini, isRTL && { marginRight: 0, marginLeft: SPACING.xs }]}>
                                    <Text style={styles.formatMiniText}>{item.format}</Text>
                                </View>
                                <Text style={styles.chatPreviewText} numberOfLines={1}>
                                    {t('chats.tap_to_view')}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.chatMeta, isRTL && { alignItems: 'flex-start' }]}>
                            <Text style={styles.chatTime}>
                                {(item as any).last_activity ? formatTime((item as any).last_activity) : ''}
                            </Text>
                            <Ionicons
                                name={isRTL ? "chevron-back" : "chevron-forward"}
                                size={16}
                                color={COLORS.textTertiary}
                                style={{ marginTop: 4 }}
                            />
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        </Animated.View>
    );

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
                    <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>{t('chats.title')}</Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchPill, isRTL && { flexDirection: 'row-reverse' }]}>
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
                </View>

                {/* Tabs */}
                <View style={[styles.tabsWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setActiveTab('upcoming');
                        }}
                        activeOpacity={0.7}
                    >
                        {activeTab === 'upcoming' && (
                            <LinearGradient
                                colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                        )}
                        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                            {t('chats.active')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setActiveTab('past');
                        }}
                        activeOpacity={0.7}
                    >
                        {activeTab === 'past' && (
                            <LinearGradient
                                colors={[COLORS.turfGreenLight, COLORS.turfGreen]}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                        )}
                        <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                            {t('chats.past')}
                        </Text>
                    </TouchableOpacity>
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
                        renderItem={renderChatItem}
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
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.m,
        paddingBottom: SPACING.s,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
        letterSpacing: 0.5,
    },
    searchContainer: {
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.m,
    },
    searchPill: {
        height: 50,
        backgroundColor: COLORS.inputBackground,
        borderRadius: BORDER_RADIUS.m,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    searchIconContainer: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInput: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 15,
        fontFamily: FONTS.body,
    },
    clearButton: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsWrapper: {
        flexDirection: 'row',
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        backgroundColor: COLORS.inputBackground,
        borderRadius: BORDER_RADIUS.m,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.s,
        overflow: 'hidden',
    },
    activeTab: {
        borderColor: COLORS.turfGreen,
    },
    tabText: {
        color: COLORS.textTertiary,
        fontWeight: '600',
        fontSize: 14,
        fontFamily: FONTS.body,
    },
    activeTabText: {
        color: COLORS.textPrimary,
    },
    listContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 120,
    },
    chatCard: {
        marginBottom: SPACING.s,
    },
    chatItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    avatarGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatMainInfo: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
        marginBottom: 4,
    },
    chatPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    formatMini: {
        backgroundColor: COLORS.successLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.xs,
        marginRight: SPACING.xs,
    },
    formatMiniText: {
        color: COLORS.turfGreenLight,
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    chatPreviewText: {
        fontSize: 13,
        color: COLORS.textTertiary,
        fontFamily: FONTS.body,
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    chatTime: {
        fontSize: 11,
        color: COLORS.textTertiary,
        fontWeight: '600',
    },
});
