import React, { useEffect, useState, useCallback } from 'react';

import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, StyleSheet, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';

import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Game, Profile } from '../../../types';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { GlassCard } from '../../../components/ui/GlassCard';
import { PremiumButton } from '../../../components/ui/PremiumButton';
import { ShareButton } from '../../../components/ui/ShareButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { SoccerField } from '../../../components/game/SoccerField';
import { LoadingState } from '../../../components/ui/LoadingState';
import { FeedbackModal } from '../../../components/ui/FeedbackModal';

type Participant = {
    user_id: string;
    status: string;
    lineup_position_id?: string;
    profiles: Profile;
};

const { width } = Dimensions.get('window');

export default function GameDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { session } = useAuth();
    const router = useRouter();
    const [game, setGame] = useState<Game | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [rainVotes, setRainVotes] = useState<number>(0);
    const [hasVotedRain, setHasVotedRain] = useState(false);
    const [showMvpVote, setShowMvpVote] = useState(false);
    const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [voteErrorModal, setVoteErrorModal] = useState(false);
    const [votedMvpTargetId, setVotedMvpTargetId] = useState<string | null>(null);
    const confettiRef = React.useRef<ConfettiCannon>(null);

    const mapRef = React.useRef<MapView>(null);

    useFocusEffect(
        useCallback(() => {
            fetchGameDetails();
        }, [id])
    );


    useEffect(() => {
        if (game) {
            fetchVotes();
        }
    }, [game]);


    const fetchGameDetails = async () => {
        if (!game) setLoading(true);
        const { data: gameData, error: gameError } = await supabase
            .from('games')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (gameError) {
            setLoading(false);
            Alert.alert(t('common.error'), t('game.game_not_found'));
            router.back();
            return;
        }

        setGame(gameData as any);

        const { data: partData, error: partError } = await supabase
            .from('participants')
            .select('*, profiles(*)')
            .eq('game_id', id);

        if (!partError) {
            setParticipants(partData as any);
        }

        setLoading(false);
    };

    const fetchVotes = async () => {
        const { count, error } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('game_id', id)
            .eq('vote_type', 'rain');

        if (!error) setRainVotes(count || 0);

        if (session?.user) {
            // Check rain vote
            const { data: rainData } = await supabase
                .from('votes')
                .select('*')
                .eq('game_id', id)
                .eq('voter_id', session.user.id)
                .eq('vote_type', 'rain')
                .maybeSingle();
            setHasVotedRain(!!rainData);

            // Check MVP vote
            const { data: mvpData } = await supabase
                .from('votes')
                .select('target_id')
                .eq('game_id', id)
                .eq('voter_id', session.user.id)
                .eq('vote_type', 'mvp')
                .maybeSingle();

            if (mvpData) {
                setVotedMvpTargetId(mvpData.target_id);
            }
        }
    };

    const joinedParticipants = participants.filter(p => p.status === 'joined');
    const waitlistParticipants = participants.filter(p => p.status === 'waitlist');
    const spotsLeft = game ? game.max_players - joinedParticipants.length : 0;
    const userParticipant = participants.find(p => p.user_id === session?.user.id);
    const isJoined = userParticipant?.status === 'joined';
    const isOnWaitlist = userParticipant?.status === 'waitlist';
    const isExpired = game ? new Date() > new Date(game.start_time) : false;

    const handleJoin = async () => {
        if (!session?.user) return;
        setJoining(true);

        const status = spotsLeft > 0 ? 'joined' : 'waitlist';

        const { error } = await supabase.from('participants').insert({
            game_id: id,
            user_id: session.user.id,
            status: status,
        });

        setJoining(false);
        if (error) {
            Alert.alert(t('common.error'), error.message);
        } else {
            if (status === 'joined') {
                confettiRef.current?.start();
            } else {
                Alert.alert(t('game.waitlist'), t('game.success_joined_waitlist'));
            }
            fetchGameDetails();
        }
    };

    const handleLeave = async () => {
        if (!session?.user) return;
        setJoining(true);

        const { error } = await supabase
            .from('participants')
            .delete()
            .eq('game_id', id)
            .eq('user_id', session.user.id);

        setJoining(false);
        if (error) {
            Alert.alert(t('common.error'), error.message);
        } else {
            fetchGameDetails();
        }
    };

    const handleRainVote = async () => {
        if (!session?.user) return;

        if (hasVotedRain) {
            const { error } = await supabase
                .from('votes')
                .delete()
                .eq('game_id', id)
                .eq('voter_id', session.user.id)
                .eq('vote_type', 'rain');

            if (error) {
                Alert.alert(t('common.error'), error.message);
            } else {
                setHasVotedRain(false);
                setRainVotes((prev) => Math.max(0, prev - 1));
                setVoteFeedback(t('game.vote_cancelled_msg'));
                setTimeout(() => setVoteFeedback(null), 3000);
            }
        } else {
            const { error } = await supabase.from('votes').insert({
                game_id: id,
                voter_id: session.user.id,
                vote_type: 'rain',
            });

            if (error) {
                Alert.alert(t('common.error'), error.message);
            } else {
                setHasVotedRain(true);
                setRainVotes((prev) => prev + 1);
                setVoteFeedback(t('game.vote_cast_msg'));
                setTimeout(() => setVoteFeedback(null), 3000);
            }
        }
    };

    const handleMvpVote = async (targetId: string) => {
        if (!session?.user) return;

        // If clicking the same player, cancel vote
        if (votedMvpTargetId === targetId) {
            // Optimistically update UI
            const previousId = votedMvpTargetId;
            setVotedMvpTargetId(null);
            setShowMvpVote(false);

            const { error } = await supabase
                .from('votes')
                .delete()
                .eq('game_id', id)
                .eq('voter_id', session.user.id)
                .eq('vote_type', 'mvp');

            if (error) {
                // Revert if failed
                setVotedMvpTargetId(previousId);
                console.error('Error deleting vote:', error);
                // If it's a permission error, we should inform the user?
                // For now, keep generic error or rely on global error handling?
                // Showing modal might be too aggressive if it's "silent" failure, but important for debugging.
                Alert.alert(t('common.error'), t('game.vote_error_title') + ": " + error.message);
            } else {
                setVoteFeedback(t('game.vote_cancelled_msg'));
                setTimeout(() => setVoteFeedback(null), 3000);
            }
            return;
            setShowMvpVote(false);
            return;
        }

        // If voting for someone else while having a vote, switch it (delete old, insert new)
        if (votedMvpTargetId) {
            await supabase
                .from('votes')
                .delete()
                .eq('game_id', id)
                .eq('voter_id', session.user.id)
                .eq('vote_type', 'mvp');
        }

        const { error } = await supabase.from('votes').insert({
            game_id: id,
            voter_id: session.user.id,
            target_id: targetId,
            vote_type: 'mvp',
        });

        if (error) {
            // Check for unique violation just in case
            if (error.code === '23505' || error.message.includes('unique')) {
                setVoteErrorModal(true);
            } else {
                Alert.alert(t('common.error'), error.message);
            }
        } else {
            setVotedMvpTargetId(targetId);
            setShowMvpVote(false);
            setShowSuccessModal(true);
            confettiRef.current?.start();
        }
    };

    const handlePickPosition = async (positionId: string) => {
        if (!session?.user) return;
        if (!isJoined) {
            Alert.alert(t('common.error'), t('game.must_join_for_lineup'));
            return;
        }

        // Check if taken
        const isTaken = participants.some(p => p.lineup_position_id === positionId && p.user_id !== session.user.id);
        if (isTaken) {
            Alert.alert(t('common.error'), t('game.position_taken'));
            return;
        }

        const { error } = await supabase
            .from('participants')
            .update({ lineup_position_id: positionId })
            .eq('game_id', id)
            .eq('user_id', session.user.id);

        if (error) {
            Alert.alert(t('common.error'), error.message);
        } else {
            fetchGameDetails();
        }
    };

    let latitude = 32.0853;
    let longitude = 34.7818;

    if (game?.location) {
        if (typeof game.location === 'string') {
            const locationStr = game.location as string;

            // Try to parse WKB hex format (PostGIS binary format)
            if (locationStr.match(/^[0-9A-Fa-f]+$/)) {
                try {
                    // Decode EWKB (assuming SRID is present, total header 9 bytes = 18 hex chars)
                    const endianByte = parseInt(locationStr.substring(0, 2), 16);
                    const isLittleEndian = endianByte === 1;

                    const lonHex = locationStr.substring(18, 34);
                    const lonView = new DataView(new Uint8Array(lonHex.match(/[\da-f]{2}/gi)!.map((h: string) => parseInt(h, 16))).buffer);
                    longitude = lonView.getFloat64(0, isLittleEndian);

                    const latHex = locationStr.substring(34, 50);
                    const latView = new DataView(new Uint8Array(latHex.match(/[\da-f]{2}/gi)!.map((h: string) => parseInt(h, 16))).buffer);
                    latitude = latView.getFloat64(0, isLittleEndian);
                } catch (e) {
                    console.warn("Error parsing WKB location:", e);
                }
            }
        }
    }

    const [region, setRegion] = useState({
        latitude: 32.0853,
        longitude: 34.7818,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015,
    });

    useFocusEffect(
        useCallback(() => {
            if (game) {
                // Force reset to game location on focus
                setRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.0015,
                    longitudeDelta: 0.0015,
                });
            }
        }, [game, latitude, longitude])
    );

    if (loading || !game) {
        return <LoadingState />;
    }


    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={StyleSheet.absoluteFill}
                        provider={PROVIDER_GOOGLE}
                        region={region}
                        onRegionChangeComplete={setRegion}


                        zoomEnabled={true}
                        scrollEnabled={true}
                        pitchEnabled={false}
                        rotateEnabled={false}
                        customMapStyle={[
                            { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
                            { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
                            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
                            { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
                            { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
                            { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
                            { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
                            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
                            { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
                            { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
                            { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
                            { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
                            { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
                            { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
                            { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
                            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
                            { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
                            { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
                        ]}>
                        <Marker coordinate={{ latitude, longitude }} pinColor={COLORS.accentOrange} />
                    </MapView >
                    <LinearGradient
                        colors={['transparent', COLORS.darkBackground]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 0, y: 1 }}
                    />

                    <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
                                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
                            </BlurView>
                        </TouchableOpacity>

                        <View style={styles.headerActions}>
                            {session?.user?.id === game.organizer_id && (
                                <TouchableOpacity
                                    style={styles.chatButton}
                                    onPress={() => router.push(`/edit-game/${id}`)}
                                >
                                    <BlurView intensity={30} tint="dark" style={styles.chatButtonBlur}>
                                        <Ionicons name="create-outline" size={24} color="white" />
                                    </BlurView>
                                </TouchableOpacity>
                            )}
                            <ShareButton
                                message={`Join me for a game of football: ${game.title}`}
                                url={`kadur://game/${id}`}
                                style={styles.shareButton}
                            />
                            {isJoined && (
                                <TouchableOpacity
                                    style={styles.chatButton}
                                    onPress={() => router.push(`/game/${id}/chat`)}
                                >
                                    <BlurView intensity={30} tint="dark" style={styles.chatButtonBlur}>
                                        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                                    </BlurView>
                                </TouchableOpacity>
                            )}
                        </View>
                    </SafeAreaView>
                </View >

                <View style={[styles.contentContainer, isRTL && { direction: 'rtl' }]}>
                    <Animated.View entering={FadeInUp.delay(200).springify()}>
                        <GlassCard style={styles.mainInfoCard}>
                            <View style={[styles.titleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={[styles.titleContainer, isRTL ? { marginRight: 0, marginLeft: SPACING.m } : { marginRight: SPACING.m }]}>
                                    <Text style={[styles.gameTitle, isRTL && { textAlign: 'right' }]}>{game.title}</Text>
                                    <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} style={[styles.metaIcon, isRTL ? { marginLeft: 6, marginRight: 0 } : { marginRight: 6 }]} />
                                        <Text style={[styles.metaText, isRTL && { textAlign: 'right' }]}>
                                            {new Date(game.start_time).toLocaleDateString(isRTL ? 'he-IL' : undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                    <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                        <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} style={[styles.metaIcon, isRTL ? { marginLeft: 6, marginRight: 0 } : { marginRight: 6 }]} />
                                        <Text style={[styles.metaText, isRTL && { textAlign: 'right' }]}>
                                            {game.start_time ? new Date(game.start_time).toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </Text>
                                    </View>
                                    <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                                        <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} style={[styles.metaIcon, isRTL ? { marginLeft: 6, marginRight: 0 } : { marginRight: 6 }]} />
                                        <Text style={[styles.metaText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                                            {game.address || t('game.location_on_map')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.formatBadge, isRTL ? { marginLeft: 0 } : { marginLeft: SPACING.m }]}>
                                    <Text style={styles.formatText}>{game.format}</Text>
                                    <Text style={styles.formatLabel}>{t('game.format')}</Text>
                                </View>
                            </View>

                            <View style={styles.descriptionContainer}>
                                <Text style={[styles.descriptionText, isRTL && { textAlign: 'right' }]}>{game.description}</Text>
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Rain Vote Section */}
                    {isJoined && game.status === 'open' && !isExpired && (
                        <Animated.View entering={FadeInUp.delay(300).springify()}>
                            <GlassCard style={styles.voteCard} intensity={40} noPadding>
                                <View style={[styles.voteHeader, isRTL && { flexDirection: 'row-reverse' }, { padding: SPACING.m }]}>
                                    <View style={[styles.voteIconContainer, isRTL ? { marginLeft: SPACING.m, marginRight: 0 } : { marginRight: SPACING.m }]}>
                                        <Ionicons name="rainy-outline" size={32} color="#60a5fa" />
                                    </View>
                                    <View style={[styles.voteTextContainer, { flex: 1 }, isRTL && { alignItems: 'flex-end' }]}>
                                        <Text style={[styles.voteTitle, isRTL && { textAlign: 'right' }]}>{t('game.rain_vote_title')}</Text>
                                        <Text style={[styles.voteSubtitle, isRTL && { textAlign: 'right' }]}>{t('game.rain_vote_subtitle', { count: rainVotes })}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.voteButton, hasVotedRain && styles.voteButtonActive, isRTL ? { marginRight: SPACING.m } : { marginLeft: SPACING.m }]}
                                        onPress={handleRainVote}
                                    >
                                        <Text style={[styles.voteButtonText, hasVotedRain && styles.voteButtonTextActive]}>
                                            {hasVotedRain ? t('game.cancel_vote') : t('game.vote_rain')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {voteFeedback && (
                                    <Animated.View entering={FadeInUp} style={styles.voteFeedbackContainer}>
                                        <Text style={[styles.voteFeedbackText, isRTL && { textAlign: 'right' }]}>{voteFeedback}</Text>
                                    </Animated.View>
                                )}
                            </GlassCard>
                        </Animated.View>
                    )}

                    {/* MVP Vote Section */}
                    {isJoined && (game.status === 'finished' || isExpired) && (
                        <Animated.View entering={FadeInUp.delay(300).springify()}>
                            <GlassCard style={styles.mvpCard} intensity={30}>
                                <View style={[styles.mvpHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                                    <Text style={[styles.mvpTitle, isRTL && { textAlign: 'right' }]}>{t('game.mvp_title')}</Text>
                                    <TouchableOpacity
                                        style={styles.mvpButton}
                                        onPress={() => setShowMvpVote(!showMvpVote)}
                                    >
                                        <Text style={styles.mvpButtonText}>{showMvpVote ? t('game.hide') : t('game.cast_vote')}</Text>
                                    </TouchableOpacity>
                                </View>

                                {showMvpVote && (
                                    <View style={styles.mvpList}>
                                        {joinedParticipants.map(p => (
                                            <TouchableOpacity
                                                key={p.user_id}
                                                style={[styles.mvpItem, isRTL && { flexDirection: 'row-reverse' }]}
                                                onPress={() => handleMvpVote(p.user_id)}
                                            >
                                                <View style={[styles.mvpUser, isRTL && { flexDirection: 'row-reverse' }]}>
                                                    <View style={[styles.mvpAvatar, isRTL ? { marginRight: 0, marginLeft: 12 } : { marginRight: 12 }]}>
                                                        <Text style={styles.mvpAvatarText}>{p.profiles.full_name?.charAt(0)}</Text>
                                                    </View>
                                                    <Text style={[styles.mvpName, isRTL && { textAlign: 'right' }]}>{p.profiles.full_name}</Text>
                                                </View>
                                                <Ionicons
                                                    name={votedMvpTargetId === p.user_id ? "trophy" : "trophy-outline"}
                                                    size={24}  // Increased size slightly
                                                    color={votedMvpTargetId === p.user_id ? "#F59E0B" : "#fbbf24"} // Slightly different shade or kept same
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </GlassCard>
                        </Animated.View>
                    )}

                    {/* Lineup Formation Section */}
                    <Animated.View entering={FadeInUp.delay(500).springify()}>
                        <View style={[styles.lineupHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('game.lineup_formation')}</Text>
                        </View>
                        <GlassCard style={styles.formationCard} intensity={20}>
                            <SoccerField
                                format={game.format}
                                participants={joinedParticipants}
                                currentUserId={session?.user?.id}
                                onPickPosition={handlePickPosition}
                                isRTL={isRTL}
                            />
                        </GlassCard>
                    </Animated.View>

                    {/* Lineup Section (List) */}
                    <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.lineupSection}>
                        <View style={[styles.lineupHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                            {isRTL ? (
                                <>
                                    <View style={styles.playerCountBadge}>
                                        <Text style={styles.playerCountText}>{joinedParticipants.length}/{game.max_players}</Text>
                                    </View>
                                    <Text style={[styles.sectionTitle, { textAlign: 'right' }]}>{t('game.participants')}</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.sectionTitle}>{t('game.participants')}</Text>
                                    <View style={styles.playerCountBadge}>
                                        <Text style={styles.playerCountText}>{joinedParticipants.length}/{game.max_players}</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {joinedParticipants.map((p) => (
                            <GlassCard key={p.user_id} style={styles.playerCard} intensity={20}>
                                <TouchableOpacity
                                    style={[styles.playerRow, isRTL && { flexDirection: 'row-reverse' }]}
                                    onPress={() => router.push(`/profile/${p.user_id}`)}
                                >
                                    <View style={[styles.playerAvatarContainer, isRTL ? { marginRight: 0, marginLeft: 12 } : { marginRight: 12 }]}>
                                        {p.profiles.avatar_url ? (
                                            <Image source={{ uri: p.profiles.avatar_url }} style={styles.playerAvatar} />
                                        ) : (
                                            <Text style={styles.playerAvatarText}>{p.profiles.full_name?.charAt(0)}</Text>
                                        )}
                                    </View>
                                    <View style={[styles.playerInfo, isRTL && { alignItems: 'flex-end' }]}>
                                        <Text style={[styles.playerName, isRTL && { textAlign: 'right' }]}>{p.profiles.full_name}</Text>
                                        <Text style={[styles.playerPosition, isRTL && { textAlign: 'right' }]}>{p.profiles.favorite_position || 'Player'}</Text>
                                    </View>
                                    {p.user_id === game.organizer_id && (
                                        <View style={styles.hostBadge}>
                                            <Text style={styles.hostText}>{t('game.host')}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </GlassCard>
                        ))}
                        {joinedParticipants.length === 0 && (
                            <View style={styles.emptyLineup}>
                                <Ionicons name="people-outline" size={32} color={COLORS.textTertiary} style={{ marginBottom: 8 }} />
                                <Text style={styles.emptyLineupText}>{t('game.no_players')}</Text>
                            </View>
                        )}

                        {/* Waitlist Section */}
                        {waitlistParticipants.length > 0 && (
                            <View style={{ marginTop: 24 }}>
                                <View style={[styles.lineupHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                                    {isRTL ? (
                                        <>
                                            <View style={[styles.playerCountBadge, { backgroundColor: 'rgba(255, 165, 0, 0.1)' }]}>
                                                <Text style={[styles.playerCountText, { color: COLORS.accentOrange }]}>{waitlistParticipants.length}</Text>
                                            </View>
                                            <Text style={[styles.sectionTitle, { textAlign: 'right' }]}>{t('game.waitlist')}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.sectionTitle}>{t('game.waitlist')}</Text>
                                            <View style={[styles.playerCountBadge, { backgroundColor: 'rgba(255, 165, 0, 0.1)' }]}>
                                                <Text style={[styles.playerCountText, { color: COLORS.accentOrange }]}>{waitlistParticipants.length}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                                {waitlistParticipants.map((p) => (
                                    <GlassCard key={p.user_id} style={styles.playerCard} intensity={10}>
                                        <TouchableOpacity
                                            style={[styles.playerRow, isRTL && { flexDirection: 'row-reverse' }]}
                                            onPress={() => router.push(`/profile/${p.user_id}`)}
                                        >
                                            <View style={[styles.playerAvatarContainer, { borderColor: 'rgba(255, 165, 0, 0.3)' }, isRTL ? { marginRight: 0, marginLeft: 12 } : { marginRight: 12 }]}>
                                                <Text style={styles.playerAvatarText}>{p.profiles.full_name?.charAt(0)}</Text>
                                            </View>
                                            <View style={[styles.playerInfo, isRTL && { alignItems: 'flex-end' }]}>
                                                <Text style={[styles.playerName, { color: COLORS.textSecondary }, isRTL && { textAlign: 'right' }]}>{p.profiles.full_name}</Text>
                                                <Text style={[styles.playerPosition, isRTL && { textAlign: 'right' }]}>{t('game.waiting')}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </GlassCard>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                </View>
            </ScrollView >

            {/* Footer Action */}
            < GlassCard style={styles.footer} intensity={80} >
                {session?.user?.id === game.organizer_id && game.status === 'open' ? (
                    <PremiumButton
                        title={t('game.cancel_game_title')}
                        onPress={() => {
                            Alert.alert(t('game.cancel_game_title'), t('game.cancel_game_confirm'), [
                                { text: t('game.no'), style: 'cancel' },
                                {
                                    text: t('game.yes_cancel'),
                                    style: 'destructive',
                                    onPress: async () => {
                                        setJoining(true);
                                        const { error } = await supabase.from('games').update({ status: 'cancelled' }).eq('id', id);
                                        setJoining(false);
                                        if (error) Alert.alert(t('common.error'), error.message);
                                        else {
                                            Alert.alert(t('common.success'), t('game.game_cancelled_msg'));
                                            router.back();
                                        }
                                    }
                                }
                            ]);
                        }}
                        disabled={joining}
                        style={{ backgroundColor: '#ef4444' }}
                        icon={<Ionicons name="trash-outline" size={24} color="white" />}
                    />
                ) : (isJoined || isOnWaitlist) ? (
                    <PremiumButton
                        title={isExpired ? t('game.ended') : (isOnWaitlist ? t('game.leave_waitlist') : t('game.leave'))}
                        onPress={handleLeave}
                        disabled={joining || isExpired}
                        style={{ backgroundColor: isExpired ? COLORS.textTertiary : '#ef4444' }}
                        icon={<Ionicons name="exit-outline" size={24} color="white" />}
                    />
                ) : (
                    <PremiumButton
                        title={isExpired ? t('game.ended') : (spotsLeft > 0 ? `${t('game.join')} (${t('game.spots_left_with_count', { count: spotsLeft })})` : t('game.waitlist'))}
                        onPress={handleJoin}
                        disabled={joining || isExpired}
                        style={{ backgroundColor: (spotsLeft > 0 && !isExpired) ? COLORS.turfGreen : (isExpired ? COLORS.textTertiary : COLORS.accentOrange) }}
                        icon={<Ionicons name={isExpired ? "time-outline" : (spotsLeft > 0 ? "add-circle-outline" : "hourglass-outline")} size={24} color="white" />}
                    />
                )
                }
            </GlassCard >
            <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} autoStart={false} ref={confettiRef} fadeOut={true} />

            {/* Success Modal */}
            <FeedbackModal
                visible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title={t('common.success')}
                message={t('game.mvp_success')}
                buttonText={t('common.done')}
                icon="trophy"
            />

            {/* Already Voted Error Modal */}
            <FeedbackModal
                visible={voteErrorModal}
                onClose={() => setVoteErrorModal(false)}
                title={t('game.vote_error_title')}
                message={t('game.vote_error_duplicate')}
                buttonText={t('common.ok')}
                type="error"
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.darkBackground,
    },
    scrollView: {
        flex: 1,
    },
    mapContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    headerSafeArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        direction: 'ltr', // Keep buttons layout consistent but handle icons inside
    },
    backButton: {
        marginTop: SPACING.s,
    },
    backButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    chatButton: {
        marginTop: SPACING.s,
    },
    chatButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: SPACING.s,
    },
    shareButton: {
        height: 40,
    },
    contentContainer: {
        padding: SPACING.m,
        marginTop: -60,
    },
    mainInfoCard: {
        padding: SPACING.l,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.l,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.m,
    },
    titleContainer: {
        flex: 1,
        marginRight: SPACING.m,
    },
    gameTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        marginBottom: SPACING.s,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    metaIcon: {
        marginRight: 6,
    },
    metaText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontFamily: FONTS.body,
    },
    formatBadge: {
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
    },
    formatText: {
        color: COLORS.accentOrange,
        fontWeight: '900',
        fontSize: 16,
    },
    formatLabel: {
        color: COLORS.textSecondary,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    descriptionContainer: {
        backgroundColor: 'transparent',
        paddingVertical: SPACING.m,
    },
    descriptionText: {
        color: COLORS.textSecondary,
        lineHeight: 22,
        fontSize: 14,
        fontFamily: FONTS.body,
    },
    voteCard: {
        padding: 0,
        borderRadius: BORDER_RADIUS.l,
        marginBottom: SPACING.l,
        borderWidth: 0,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    voteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voteTitle: {
        fontWeight: 'bold',
        color: '#60a5fa',
        fontSize: 16,
        fontFamily: FONTS.heading,
    },
    voteSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        marginTop: 2,
        fontFamily: FONTS.body,
    },
    voteFeedbackContainer: {
        marginTop: SPACING.m,
        padding: SPACING.s,
        backgroundColor: 'transparent',
        borderRadius: BORDER_RADIUS.m,
        borderLeftWidth: 3,
        borderLeftColor: '#60a5fa',
    },
    voteFeedbackText: {
        color: 'white',
        fontSize: 12,
        fontFamily: FONTS.body,
        fontStyle: 'italic',
    },
    voteIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voteTextContainer: {
        justifyContent: 'center',
    },
    voteButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: BORDER_RADIUS.full,
        minWidth: 100,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    voteButtonActive: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    voteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
        fontFamily: FONTS.heading,
    },
    voteButtonTextActive: {
        color: COLORS.textSecondary,
    },
    mvpCard: {
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.l,
        marginBottom: SPACING.l,
        borderWidth: 0,
    },
    mvpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    mvpTitle: {
        fontWeight: 'bold',
        color: '#fbbf24',
        fontSize: 16,
        fontFamily: FONTS.heading,
    },
    mvpButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    mvpButtonText: {
        color: '#fbbf24',
        fontWeight: 'bold',
        fontSize: 12,
    },
    mvpCount: {
        color: '#fbbf24',
        fontWeight: 'bold',
        fontSize: 14,
    },
    formationCard: {
        padding: 0,
        borderRadius: BORDER_RADIUS.l,
        marginBottom: SPACING.l,
        overflow: 'hidden',
        alignItems: 'center',
    },
    mvpList: {
        marginTop: SPACING.s,
    },
    mvpItem: {
        padding: SPACING.s,
        borderBottomWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mvpUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mvpAvatar: {
        width: 32,
        height: 32,
        backgroundColor: 'transparent',
        borderRadius: 16,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    mvpAvatarText: {
        fontWeight: 'bold',
        color: '#fbbf24',
    },
    mvpName: {
        fontWeight: '600',
        color: 'white',
        fontSize: 14,
    },
    lineupSection: {
        marginBottom: 100,
    },
    lineupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
    },
    playerCountBadge: {
        backgroundColor: 'transparent',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    playerCountText: {
        color: COLORS.turfGreen,
        fontWeight: 'bold',
        fontSize: 12,
    },
    playerCard: {
        marginBottom: SPACING.s,
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.l,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerAvatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
        borderWidth: 0,
    },
    playerAvatar: {
        width: '100%',
        height: '100%',
    },
    playerAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    playerPosition: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textTransform: 'capitalize',
    },
    hostBadge: {
        backgroundColor: COLORS.accentOrange,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    hostText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyLineup: {
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyLineupText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.m,
        paddingBottom: 34,
        borderTopWidth: 0,
    },
    successButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONTS.heading,
    },
});
