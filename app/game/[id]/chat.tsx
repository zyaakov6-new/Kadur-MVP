import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { GlassCard } from '../../../components/ui/GlassCard';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { LoadingState } from '../../../components/ui/LoadingState';

type Message = {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    profiles: {
        full_name: string;
        avatar_url: string | null;
    };
    status?: 'sending' | 'sent' | 'delivered';
};

type GameDetail = {
    id: string;
    title: string;
};

export default function ChatScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [game, setGame] = useState<GameDetail | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchGameTitle();
        fetchMessages();

        const channel = supabase
            .channel(`game_chat:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `game_id=eq.${id}`,
                },
                (payload) => {
                    console.log('Realtime payload received:', payload);
                    if (payload.new.user_id !== session?.user.id) {
                        fetchNewMessage(payload.new.id);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Subscription status for game_chat:${id}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, session?.user.id]);

    const fetchGameTitle = async () => {
        const { data, error } = await supabase
            .from('games')
            .select('id, title')
            .eq('id', id)
            .maybeSingle();

        if (!error && data) {
            setGame(data);
        }
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*, profiles(full_name, avatar_url)')
            .eq('game_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error(error);
            setLoading(false);
        } else {
            setMessages(data?.map(m => ({ ...m, status: 'delivered' })) as any || []);
            setLoading(false);
        }
    };

    const fetchNewMessage = async (messageId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*, profiles(full_name, avatar_url)')
            .eq('id', messageId)
            .maybeSingle();

        if (!error && data) {
            setMessages((prev) => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, { ...data, status: 'delivered' } as any];
            });
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !session?.user) return;

        const text = inputText.trim();
        setInputText('');

        const tempId = Math.random().toString();
        const optimisticMessage: Message = {
            id: tempId,
            content: text,
            user_id: session.user.id,
            created_at: new Date().toISOString(),
            profiles: {
                full_name: session.user.user_metadata?.full_name || 'Me',
                avatar_url: session.user.user_metadata?.avatar_url || null,
            },
            status: 'sending'
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const { data, error } = await supabase.from('messages').insert({
                game_id: id,
                user_id: session.user.id,
                content: text,
            }).select().maybeSingle();

            if (error) throw error;

            if (data) {
                setMessages((prev) => prev.map(m =>
                    m.id === tempId ? { ...m, id: data.id, created_at: data.created_at, status: 'sent' } : m
                ));
                // Simulate "delivered" shortly after
                setTimeout(() => {
                    setMessages((prev) => prev.map(m =>
                        m.id === data.id ? { ...m, status: 'delivered' } : m
                    ));
                }, 1000);
            }
        } catch (error) {
            console.error('Send error:', error);
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            setInputText(text);
            Alert.alert(t('common.error'), t('chat.send_failed') || 'Failed to send message');
        }
    };

    const renderMessage = ({ item, index }: { item: Message, index: number }) => {
        const isMe = item.user_id === session?.user.id;
        const showAvatar = !isMe;

        return (
            <Animated.View
                entering={FadeInUp.delay(index * 50).springify()}
                style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}
            >
                {showAvatar && (
                    <TouchableOpacity
                        onPress={() => router.push(`/profile/${item.user_id}`)}
                        style={styles.avatarContainer}
                    >
                        {item.profiles?.avatar_url ? (
                            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholderInner}>
                                <Text style={styles.avatarText}>{item.profiles?.full_name?.charAt(0)}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isMe ? styles.messageBubbleMe : styles.messageBubbleOther
                    ]}
                >
                    {!isMe && (
                        <Text style={styles.senderName}>{item.profiles?.full_name}</Text>
                    )}
                    <Text style={isMe ? styles.messageTextMe : styles.messageTextOther}>{item.content}</Text>
                    <View style={styles.messageMeta}>
                        <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
                            {item.created_at ? new Date(item.created_at).toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                        {isMe && (
                            <View style={styles.statusIcons}>
                                {item.status === 'sending' ? (
                                    <View style={styles.statusDot} />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="checkmark"
                                            size={12}
                                            color="rgba(255,255,255,0.6)"
                                            style={styles.checkIcon}
                                        />
                                        {item.status === 'delivered' && (
                                            <Ionicons
                                                name="checkmark"
                                                size={12}
                                                color="rgba(255,255,255,0.6)"
                                                style={[styles.checkIcon, { marginLeft: -8 }]}
                                            />
                                        )}
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.darkBackground, '#001a10']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.headerUserInfo, isRTL && { flexDirection: 'row-reverse' }]}
                        onPress={() => router.push(`/game/${id}`)}
                    >
                        <View style={[styles.headerTextContainer, isRTL && { alignItems: 'flex-end' }]}>
                            <Text style={styles.headerTitle} numberOfLines={1}>{game ? game.title : t('chat.title')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    {loading ? (
                        <LoadingState message={t('chat.loading')} />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            style={styles.list}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            renderItem={renderMessage}
                        />
                    )}

                    <View style={styles.inputWrapper}>
                        <BlurView intensity={20} tint="dark" style={[styles.inputContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                            <TextInput
                                style={[styles.input, isRTL && { textAlign: 'right' }]}
                                placeholder={t('chat.placeholder')}
                                placeholderTextColor={COLORS.textTertiary}
                                value={inputText}
                                onChangeText={setInputText}
                                onSubmitEditing={handleSend}
                                multiline
                            />
                            <View style={[styles.rightActions, isRTL && { flexDirection: 'row-reverse' }]}>
                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={handleSend}
                                    disabled={!inputText.trim()}
                                >
                                    <LinearGradient
                                        colors={inputText.trim() ? [COLORS.turfGreen, '#004d33'] : [COLORS.accentOrange, '#e64a19']}
                                        style={styles.sendButtonPill}
                                    >
                                        <Ionicons
                                            name="send"
                                            size={20}
                                            color="white"
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    </View>
                </KeyboardAvoidingView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerUserInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    headerAvatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        position: 'relative',
    },
    headerAvatarInner: {
        flex: 1,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: '#050B08',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: 20,
    },
    messageRow: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholderInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
        maxWidth: '75%',
    },
    messageBubbleMe: {
        backgroundColor: COLORS.turfGreen,
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderBottomLeftRadius: 4,
    },
    messageTextMe: {
        color: 'white',
        fontSize: 15,
        fontFamily: FONTS.body,
    },
    messageTextOther: {
        color: 'white',
        fontSize: 15,
        fontFamily: FONTS.body,
    },
    messageTime: {
        fontSize: 9,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    messageTimeMe: {
        color: 'rgba(255,255,255,0.6)',
    },
    messageTimeOther: {
        color: COLORS.textTertiary,
    },
    inputWrapper: {
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    },
    inputContainer: {
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontFamily: FONTS.body,
        paddingHorizontal: 8,
        maxHeight: 100,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sendButton: {
        marginLeft: 8,
    },
    sendButtonPill: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.turfGreen,
        marginBottom: 2,
    },
    messageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    statusIcons: {
        flexDirection: 'row',
        marginLeft: 4,
        alignItems: 'center',
    },
    statusDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    checkIcon: {
        marginLeft: 2,
    },
});
