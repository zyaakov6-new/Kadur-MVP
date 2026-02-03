import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform, Keyboard, FlatList, Modal } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { GlassCard } from '../components/ui/GlassCard';
import { PremiumButton } from '../components/ui/PremiumButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Haptics from 'expo-haptics';
import { LoadingState } from '../components/ui/LoadingState';
import { FeedbackModal } from '../components/ui/FeedbackModal';

export default function CreateGameScreen() {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { session } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [geocodingEnabled, setGeocodingEnabled] = useState(true);
    const googlePlacesRef = useRef<any>(null);



    const mapRef = useRef<MapView>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [format, setFormat] = useState('5v5');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [address, setAddress] = useState('');
    const isManualSearch = useRef(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [location, setLocation] = useState({
        latitude: 32.0853,
        longitude: 34.7818,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });


    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    try {
                        let loc = await Location.getCurrentPositionAsync({});
                        const initialRegion = {
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                            latitudeDelta: 0.001,
                            longitudeDelta: 0.001,
                        };

                        setLocation(initialRegion);
                        try {
                            const result = await Location.reverseGeocodeAsync({
                                latitude: initialRegion.latitude,
                                longitude: initialRegion.longitude,
                            });
                            if (result && result.length > 0) {
                                const addr = result[0];
                                const addressString = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}`;
                                setAddress(addressString.trim());
                            }
                        } catch (error) {
                            setGeocodingEnabled(false);
                        }

                        // Manually animate once on load
                        mapRef.current?.animateToRegion(initialRegion, 1000);


                    } catch (error) {
                        console.log('Could not get current location, using default', error);
                    }
                }
            } catch (error) {
                console.log('Location permission error', error);
            }
        })();
    }, []);

    const onRegionChangeComplete = async (region: any) => {
        setLocation(region);
        if (isManualSearch.current || !geocodingEnabled) {
            isManualSearch.current = false;
            return;
        }
        try {
            const result = await Location.reverseGeocodeAsync({
                latitude: region.latitude,
                longitude: region.longitude,
            });
            if (result && result.length > 0) {
                const addr = result[0];
                const addressString = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}`;
                setAddress(addressString.trim());
            }
        } catch (error) {
            setGeocodingEnabled(false);
        }
    };






    const handleCreate = async () => {
        if (!title || !description) {
            Alert.alert(t('common.error'), t('create_game.error_fill_fields'));
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const point = `POINT(${location.longitude} ${location.latitude})`;

            const { data: gameData, error: gameError } = await supabase.from('games').insert({
                organizer_id: user.id,
                title,
                description,
                format,
                start_time: date.toISOString(),
                max_players: format === '5v5' ? 10 : format === '7v7' ? 14 : 22,
                location: point,
                address: address,
                status: 'open',
            }).select().single();

            if (gameError) throw gameError;

            await supabase.from('participants').insert({
                game_id: gameData.id,
                user_id: user.id,
                status: 'joined',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Create game error:', error);
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMapPress = (e: any) => {
        setLocation({
            ...location,
            ...e.nativeEvent.coordinate,
        });
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            return;
        }
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShowTimePicker(false);
            return;
        }
        const currentDate = selectedDate || date;
        setShowTimePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };


    const renderHeader = () => (
        <View style={styles.headerContent}>
            <Text style={styles.screenTitle}>{t('create_game.title')}</Text>

            <View style={styles.searchPillWrapper}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <GooglePlacesAutocomplete
                    placeholder={t('create_game.placeholder_search_location')}
                    onPress={(data, details = null) => {
                        setIsSearchFocused(false);
                        if (details) {
                            isManualSearch.current = true;
                            const newLoc = {
                                latitude: details.geometry.location.lat,
                                longitude: details.geometry.location.lng,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            };
                            setLocation(newLoc);
                            setAddress(data.description);
                            Keyboard.dismiss();

                            // Explicitly animate to the selected location
                            mapRef.current?.animateToRegion(newLoc, 1000);
                        }
                    }}


                    query={{
                        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                        language: isRTL ? 'he' : 'en',
                        types: 'address',
                    }}
                    fetchDetails={true}
                    debounce={300}
                    minLength={2}
                    enablePoweredByContainer={false}
                    styles={{
                        container: { flex: 0, backgroundColor: 'transparent' },
                        textInputContainer: { backgroundColor: 'transparent', height: 56, borderRadius: 28 },
                        textInput: [styles.searchInput, isRTL && { textAlign: 'right' }],
                        listView: [
                            styles.searchListView,
                            { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 9999 },
                            !isSearchFocused && { height: 0, opacity: 0, padding: 0, margin: 0 }
                        ],
                        row: { backgroundColor: 'transparent', padding: 13, height: 44, flexDirection: isRTL ? 'row-reverse' : 'row' },
                        description: { color: 'white', fontSize: 14 },
                        separator: { backgroundColor: 'rgba(255,255,255,0.1)' },
                    }}

                    textInputProps={{
                        placeholderTextColor: 'rgba(255,255,255,0.4)',
                        selectionColor: COLORS.turfGreen,
                        autoCorrect: false,
                        onFocus: () => setIsSearchFocused(true),
                        onBlur: () => {
                            // Delay slightly to allow onPress to register
                            setTimeout(() => setIsSearchFocused(false), 200);
                        },
                    }}

                />
            </View>



            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={location}
                    onRegionChangeComplete={onRegionChangeComplete}
                    onPress={handleMapPress}
                    customMapStyle={mapStyle}
                >
                    <Marker coordinate={location} pinColor={COLORS.turfGreen} />
                </MapView>
                <View style={[styles.addressBadge, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="location" size={16} color={COLORS.turfGreen} />
                    <Text style={[styles.addressText, isRTL ? { marginRight: 6 } : { marginLeft: 6 }, isRTL && { textAlign: 'right' }]} numberOfLines={1}>{address || t('create_game.searching_address')}</Text>
                </View>
            </View>
        </View>
    );

    const renderForm = () => (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassCard style={styles.formCard}>
                <View style={[styles.labelWrapper, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('create_game.label_title')}
                    </Text>
                </View>



                <TextInput
                    style={[styles.input, isRTL && { textAlign: 'right' }]}
                    placeholder={t('create_game.placeholder_title')}
                    placeholderTextColor={COLORS.textTertiary}
                    value={title}
                    onChangeText={setTitle}
                />

                <View style={[styles.labelWrapper, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('create_game.label_format')}
                    </Text>
                </View>



                <View style={styles.formatContainer}>
                    {['5v5', '7v7', '11v11'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.formatOption,
                                format === f && styles.formatOptionActive,
                                { borderColor: format === f ? COLORS.turfGreen : 'rgba(255,255,255,0.1)' }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setFormat(f);
                            }}
                        >
                            <Ionicons
                                name={f === '5v5' ? 'people' : f === '7v7' ? 'people-circle' : 'shirt'}
                                size={18}
                                color={format === f ? 'white' : COLORS.textTertiary}
                                style={{ marginBottom: 4 }}
                            />
                            <Text style={[
                                styles.formatText,
                                format === f && styles.formatTextActive
                            ]}>{f}</Text>

                        </TouchableOpacity>

                    ))}
                </View>

                <View style={[styles.labelWrapper, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('create_game.label_datetime')}
                    </Text>
                </View>



                <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                        style={[styles.dateTimeButton, isRTL && { flexDirection: 'row-reverse' }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowDatePicker(true);
                        }}
                    >
                        <Ionicons name="calendar-outline" size={20} color={COLORS.turfGreen} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                        <Text style={styles.dateTimeText}>{date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dateTimeButton, isRTL && { flexDirection: 'row-reverse' }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowTimePicker(true);
                        }}
                    >
                        <Ionicons name="time-outline" size={20} color={COLORS.turfGreen} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                        <Text style={styles.dateTimeText}>{date.toLocaleTimeString(isRTL ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>

                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        themeVariant="dark"
                    />
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={date}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onTimeChange}
                        themeVariant="dark"
                    />
                )}

                <View style={[styles.labelWrapper, isRTL ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('create_game.label_description')}
                    </Text>
                </View>



                <TextInput
                    style={[styles.input, styles.textArea, isRTL && { textAlign: 'right' }]}
                    placeholder={t('create_game.placeholder_description')}
                    placeholderTextColor={COLORS.textTertiary}
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                />

                <PremiumButton
                    title={t('create_game.button_create')}
                    onPress={handleCreate}
                    loading={loading}
                    icon={<Ionicons name="add-circle" size={24} color="white" />}
                    style={styles.submitButtonContainer}
                />
            </GlassCard>
            <View style={{ height: 100 }} />
        </Animated.View>
    );

    if (loading) return <LoadingState />;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050B08', '#00261A', '#004D33']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={[{ id: 'form' }]}
                    keyExtractor={item => item.id}
                    renderItem={() => (
                        <View style={styles.scrollContent}>
                            {renderHeader()}
                            {renderForm()}
                        </View>
                    )}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            </SafeAreaView>

            <FeedbackModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.back();
                }}
                title={t('common.success')}
                message={t('create_game.success_created')}
                buttonText={t('common.done')}
            />
        </View>
    );
}

const mapStyle = [
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
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.m,
    },
    headerContent: {
        marginTop: SPACING.s,
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        marginBottom: SPACING.l,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        flexWrap: 'wrap',
    },
    searchPillWrapper: {
        marginBottom: SPACING.m,
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        zIndex: 1000,
        overflow: 'visible',
        backgroundColor: 'transparent',
    },



    searchInput: {
        backgroundColor: 'transparent',
        color: 'white',
        height: 56,
        fontSize: 16,
        paddingHorizontal: 20,
        fontFamily: FONTS.body,
        margin: 0,
        borderRadius: 28,
    },

    searchListView: {
        backgroundColor: '#0A120E',
        borderRadius: BORDER_RADIUS.m,
        marginTop: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },

    mapContainer: {
        height: 200,
        borderRadius: BORDER_RADIUS.l,
        overflow: 'hidden',
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    addressBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressText: {
        color: 'white',
        fontSize: 12,
        marginLeft: 6,
        flex: 1,
    },
    formCard: {
        padding: SPACING.l,
        marginBottom: SPACING.xl,
    },
    label: {
        color: COLORS.turfGreen,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        fontFamily: FONTS.body,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    labelWrapper: {
        width: '100%',
        marginBottom: 2,
    },


    input: {
        backgroundColor: 'transparent',
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        color: 'white',
        fontSize: 16,
        marginBottom: SPACING.l,
        borderWidth: 0,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    formatContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.l,
    },
    formatOption: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: SPACING.m,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.m,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    formatOptionActive: {
        backgroundColor: COLORS.turfGreen,
        borderColor: COLORS.turfGreen,
    },
    formatText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    formatTextActive: {
        color: 'white',
    },
    dateTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.l,
    },
    dateTimeButton: {
        flex: 0.48,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dateTimeText: {
        color: 'white',
        fontSize: 14,
    },
    submitButtonContainer: {
        marginTop: SPACING.m,
        borderRadius: BORDER_RADIUS.l,
        overflow: 'hidden',
        height: 56,
        elevation: 5,
        shadowColor: COLORS.turfGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.l,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.heading,
    },
    successButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.heading,
    },
});

