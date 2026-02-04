import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard, FlatList } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Haptics from 'expo-haptics';
import { FeedbackModal, AlertState } from '../components/ui/FeedbackModal';
import { ActivityIndicator } from 'react-native';

// Vibrant color palette matching the app
const COLORS = {
    primary: '#00D26A',
    primaryDark: '#00A855',
    primaryLight: '#00E676',
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

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#1d2c22" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3e31" }] },
    { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#283d2f" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6f9283" }] },
    { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#023e25" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#3C7680" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a3d" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#255035" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c5c3f" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255035" }] },
    { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a7ab" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1d17" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e6d5a" }] }
];

export default function CreateGameScreen() {
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
    const [errorAlert, setErrorAlert] = useState<AlertState>({ visible: false, title: '', message: '' });

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
            setErrorAlert({
                visible: true,
                title: 'שגיאה',
                message: 'נא למלא כותרת ותיאור',
                type: 'warning'
            });
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

            await supabase.from('game_participants').insert({
                game_id: gameData.id,
                user_id: user.id,
                status: 'joined',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Create game error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorAlert({
                visible: true,
                title: 'שגיאה',
                message: error.message,
                type: 'error'
            });
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
            <Text style={styles.screenTitle}>יצירת משחק חדש</Text>
            <Text style={styles.screenSubtitle}>בחרו מיקום, תאריך וזמן</Text>

            <View style={styles.searchPillWrapper}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <GooglePlacesAutocomplete
                    placeholder="חפשו כתובת..."
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
                            mapRef.current?.animateToRegion(newLoc, 1000);
                        }
                    }}
                    query={{
                        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                        language: 'he',
                        types: 'address',
                    }}
                    fetchDetails={true}
                    debounce={300}
                    minLength={2}
                    enablePoweredByContainer={false}
                    styles={{
                        container: { flex: 0, backgroundColor: 'transparent' },
                        textInputContainer: { backgroundColor: 'transparent', height: 56, borderRadius: 28 },
                        textInput: styles.searchInput,
                        listView: [
                            styles.searchListView,
                            { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 9999 },
                            !isSearchFocused && { height: 0, opacity: 0, padding: 0, margin: 0 }
                        ],
                        row: { backgroundColor: 'transparent', padding: 13, height: 44, flexDirection: 'row-reverse' },
                        description: { color: COLORS.textPrimary, fontSize: 14, textAlign: 'right' },
                        separator: { backgroundColor: COLORS.cardBorder },
                    }}
                    textInputProps={{
                        placeholderTextColor: COLORS.textMuted,
                        selectionColor: COLORS.primary,
                        autoCorrect: false,
                        onFocus: () => setIsSearchFocused(true),
                        onBlur: () => {
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
                    <Marker coordinate={location} pinColor={COLORS.primary} />
                </MapView>
                <View style={styles.addressBadge}>
                    <Ionicons name="location" size={16} color={COLORS.primary} />
                    <Text style={styles.addressText} numberOfLines={1}>{address || 'מחפש כתובת...'}</Text>
                </View>
            </View>
        </View>
    );

    const renderForm = () => (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <View style={styles.formCard}>
                <LinearGradient
                    colors={[COLORS.cardBg, 'rgba(255,255,255,0.04)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Title Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>כותרת המשחק *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="football-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="לדוגמה: כדורגל ערב בפארק"
                            placeholderTextColor={COLORS.textMuted}
                            value={title}
                            onChangeText={setTitle}
                            textAlign="right"
                        />
                    </View>
                </View>

                {/* Format Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>פורמט משחק</Text>
                    <View style={styles.formatContainer}>
                        {['5v5', '7v7', '11v11'].map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.formatOption,
                                    format === f && styles.formatOptionActive,
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setFormat(f);
                                }}
                                activeOpacity={0.7}
                            >
                                {format === f && (
                                    <LinearGradient
                                        colors={[COLORS.primary, COLORS.primaryDark]}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                )}
                                <Ionicons
                                    name={f === '5v5' ? 'people' : f === '7v7' ? 'people-circle' : 'shirt'}
                                    size={20}
                                    color={format === f ? COLORS.bgDark : COLORS.textSecondary}
                                />
                                <Text style={[
                                    styles.formatText,
                                    format === f && styles.formatTextActive
                                ]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Date & Time */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>תאריך ושעה</Text>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity
                            style={styles.dateTimeButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setShowDatePicker(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="calendar-outline" size={20} color={COLORS.accentBlue} />
                            <Text style={styles.dateTimeText}>{date.toLocaleDateString('he-IL')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.dateTimeButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setShowTimePicker(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="time-outline" size={20} color={COLORS.accentOrange} />
                            <Text style={styles.dateTimeText}>{date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                    </View>
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

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>תיאור *</Text>
                    <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="ספרו עוד על המשחק..."
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                            textAlign="right"
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? [COLORS.textMuted, COLORS.textMuted] : [COLORS.primary, COLORS.primaryDark]}
                        style={styles.submitGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.bgDark} />
                        ) : (
                            <>
                                <Ionicons name="add-circle" size={24} color={COLORS.bgDark} style={{ marginLeft: 8 }} />
                                <Text style={styles.submitText}>צור משחק</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <View style={{ height: 120 }} />
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.bgDark, COLORS.bgMid, COLORS.bgLight]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative glow orbs */}
            <View style={[styles.glowOrb, styles.glowOrb1]} />
            <View style={[styles.glowOrb, styles.glowOrb2]} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
                            <Ionicons name="arrow-forward" size={22} color={COLORS.textPrimary} />
                        </BlurView>
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
                title="המשחק נוצר בהצלחה"
                message="המשחק נוצר והוא מוכן לשחקנים"
                buttonText="יאללה!"
            />

            <FeedbackModal
                visible={errorAlert.visible}
                onClose={() => setErrorAlert({ ...errorAlert, visible: false })}
                title={errorAlert.title}
                message={errorAlert.message}
                buttonText="אישור"
                type={errorAlert.type || 'error'}
            />
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
        top: -50,
        left: -100,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
    },
    glowOrb2: {
        bottom: 200,
        right: -150,
        backgroundColor: COLORS.accentPurple,
        opacity: 0.08,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    backButtonBlur: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    headerContent: {
        marginTop: 8,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
        textAlign: 'right',
        marginBottom: 4,
    },
    screenSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'right',
        marginBottom: 20,
    },
    searchPillWrapper: {
        marginBottom: 16,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        zIndex: 1000,
        overflow: 'visible',
        backgroundColor: COLORS.inputBg,
    },
    searchInput: {
        backgroundColor: 'transparent',
        color: COLORS.textPrimary,
        height: 56,
        fontSize: 16,
        paddingHorizontal: 20,
        margin: 0,
        borderRadius: 28,
        textAlign: 'right',
    },
    searchListView: {
        backgroundColor: COLORS.bgMid,
        borderRadius: 16,
        marginTop: 5,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    mapContainer: {
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    addressBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(10, 26, 20, 0.9)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    addressText: {
        color: COLORS.textPrimary,
        fontSize: 13,
        marginRight: 8,
        flex: 1,
        textAlign: 'right',
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 10,
        textAlign: 'right',
    },
    inputWrapper: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        paddingHorizontal: 16,
        height: 56,
    },
    textAreaWrapper: {
        height: 120,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        textAlign: 'right',
    },
    textArea: {
        height: '100%',
        textAlignVertical: 'top',
    },
    formatContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        gap: 10,
    },
    formatOption: {
        flex: 1,
        height: 70,
        borderRadius: 16,
        backgroundColor: COLORS.inputBg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    formatOptionActive: {
        borderColor: COLORS.primary,
    },
    formatText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginTop: 6,
    },
    formatTextActive: {
        color: COLORS.bgDark,
    },
    dateTimeRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        gap: 12,
    },
    dateTimeButton: {
        flex: 1,
        height: 56,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        gap: 8,
    },
    dateTimeText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    submitButton: {
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitGradient: {
        height: 56,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.bgDark,
    },
});
