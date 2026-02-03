import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Keyboard, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LoadingState } from '../../components/ui/LoadingState';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function EditGameScreen() {
    const { id } = useLocalSearchParams();
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const confettiRef = useRef<ConfettiCannon>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [format, setFormat] = useState('5v5');
    const [date, setDate] = useState(new Date());
    const [address, setAddress] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const isManualSearch = useRef(false);

    const [location, setLocation] = useState({
        latitude: 32.0853,
        longitude: 34.7818,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015,
    });
    const isReady = useRef(false);

    useEffect(() => {
        fetchGameDetails();
    }, [id]);

    const fetchGameDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setTitle(data.title);
                setDescription(data.description);
                setFormat(data.format);
                setDate(new Date(data.start_time));
                setAddress(data.address);

                if (data.location) {
                    let lat = 32.0853;
                    let lng = 34.7818;

                    if (typeof data.location === 'string') {
                        const locationStr = data.location;
                        // Try to parse WKB hex format (PostGIS binary format)
                        if (locationStr.match(/^[0-9A-Fa-f]+$/)) {
                            try {
                                const endianByte = parseInt(locationStr.substring(0, 2), 16);
                                const isLittleEndian = endianByte === 1;
                                const lonHex = locationStr.substring(18, 34);
                                const lonView = new DataView(new Uint8Array(lonHex.match(/[\da-f]{2}/gi)!.map((h: string) => parseInt(h, 16))).buffer);
                                lng = lonView.getFloat64(0, isLittleEndian);
                                const latHex = locationStr.substring(34, 50);
                                const latView = new DataView(new Uint8Array(latHex.match(/[\da-f]{2}/gi)!.map((h: string) => parseInt(h, 16))).buffer);
                                lat = latView.getFloat64(0, isLittleEndian);
                            } catch (e) {
                                console.warn("Error parsing WKB location:", e);
                            }
                        } else {
                            // Fallback to POINT string format
                            const coords = locationStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                            if (coords) {
                                lng = parseFloat(coords[1]);
                                lat = parseFloat(coords[2]);
                            }
                        }
                    }

                    const initialLoc = {
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: 0.0015,
                        longitudeDelta: 0.0015,
                    };
                    setLocation(initialLoc);
                }
            }
        } catch (error) {
            console.error('Error fetching game details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const point = `POINT(${location.longitude} ${location.latitude})`;
            const { error } = await supabase
                .from('games')
                .update({
                    title,
                    description,
                    format,
                    start_time: date.toISOString(),
                    address,
                    location: point,
                    max_players: format === '5v5' ? 10 : format === '7v7' ? 14 : 22,
                })
                .eq('id', id);

            if (error) throw error;
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error updating game:', error);
        } finally {
            setSaving(false);
        }
    };

    // Only animate to region on initial load
    useEffect(() => {
        if (!loading && mapRef.current) {
            mapRef.current.animateToRegion(location, 500);
        }
    }, [loading]);

    if (loading) {
        return <LoadingState />;
    }

    const renderHeader = () => (
        <View style={styles.mapContainer}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                initialRegion={location}
                onRegionChangeComplete={async (region) => {
                    // Only update location and address from map movement after data is loaded and isReady is true
                    if (isReady.current && !isManualSearch.current) {
                        setLocation(prev => ({
                            ...prev,
                            latitude: region.latitude,
                            longitude: region.longitude,
                        }));

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
                            console.error('Reverse geocoding error:', error);
                        }
                    } else if (!loading) {
                        // Mark as ready after the first change (initial mount stabilization)
                        isReady.current = true;
                    }
                    isManualSearch.current = false;
                }}
                customMapStyle={mapStyle}
            />

            {/* Search Bar Pill */}
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
                                latitudeDelta: 0.0015,
                                longitudeDelta: 0.0015,
                            };
                            setLocation(newLoc);
                            setAddress(data.description);
                            Keyboard.dismiss();
                            mapRef.current?.animateToRegion(newLoc, 1000);
                        }
                    }}
                    query={{
                        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                        language: isRTL ? 'he' : 'en',
                        types: 'address',
                    }}
                    fetchDetails={true}
                    enablePoweredByContainer={false}
                    debounce={400}
                    minLength={2}
                    textInputProps={{
                        placeholderTextColor: 'rgba(255,255,255,0.4)',
                        selectionColor: COLORS.turfGreen,
                        autoCorrect: false,
                        onFocus: () => setIsSearchFocused(true),
                        onBlur: () => setTimeout(() => setIsSearchFocused(false), 200),
                    }}
                    styles={{
                        container: { flex: 0, backgroundColor: 'transparent' },
                        textInputContainer: { backgroundColor: 'transparent', height: 56, borderRadius: 28 },
                        textInput: [styles.searchInput, isRTL && { textAlign: 'right' }],
                        listView: [
                            styles.searchListView,
                            {
                                position: 'absolute',
                                top: 60,
                                left: 0,
                                right: 0,
                                zIndex: 9999,
                                display: isSearchFocused ? 'flex' : 'none',
                            },
                        ],
                        row: { backgroundColor: 'transparent', padding: 13, height: 44, flexDirection: isRTL ? 'row-reverse' : 'row' },
                        description: { color: 'white', fontSize: 14 },
                        separator: { backgroundColor: 'rgba(255,255,255,0.1)' },
                    }}
                />
            </View>

            <View style={styles.pinContainer}>
                <Ionicons name="location" size={40} color={COLORS.turfGreen} />
            </View>

            <View style={styles.addressContainer}>
                <BlurView intensity={30} tint="dark" style={styles.addressBlur}>
                    <Ionicons name="location-outline" size={16} color="white" style={isRTL ? { marginLeft: 6 } : { marginRight: 6 }} />
                    <Text style={styles.addressText} numberOfLines={1}>{address || t('create_game.searching_address')}</Text>
                </BlurView>
            </View>

            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
                        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="white" />
                    </BlurView>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );

    const renderForm = () => (
        <View style={styles.contentContainer}>
            <Animated.View entering={FadeInUp.delay(200).springify()}>
                <View style={[styles.labelWrapper, { alignItems: 'center' }]}>
                    <Text style={[styles.screenTitle, { textAlign: 'center' }]}>{t('edit_game.title')}</Text>
                </View>

                <GlassCard style={styles.formCard}>
                    <View style={[styles.labelWrapper, { alignItems: 'center' }]}>
                        <Text style={[styles.label, { textAlign: 'center' }]}>{t('create_game.label_title')}</Text>
                    </View>
                    <TextInput
                        style={[styles.input, { textAlign: 'center' }]}
                        placeholder={t('create_game.placeholder_title')}
                        placeholderTextColor={COLORS.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <View style={[styles.labelWrapper, { alignItems: 'center' }]}>
                        <Text style={[styles.label, { textAlign: 'center' }]}>{t('create_game.label_format')}</Text>
                    </View>
                    <View style={[styles.formatContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                        {['5v5', '7v7', '11v11'].map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.formatOption, format === f && styles.formatOptionActive]}
                                onPress={() => setFormat(f)}
                            >
                                <View style={styles.formatItemContent}>
                                    <Ionicons
                                        name={f === '5v5' ? 'people' : f === '7v7' ? 'people-circle' : 'shirt'}
                                        size={18}
                                        color={format === f ? 'white' : COLORS.textTertiary}
                                    />
                                    <Text style={[styles.formatText, format === f && styles.formatTextActive, isRTL ? { marginRight: 8 } : { marginLeft: 8 }]}>
                                        {f}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.labelWrapper, { alignItems: 'center' }]}>
                        <Text style={[styles.label, { textAlign: 'center' }]}>{t('create_game.label_datetime')}</Text>
                    </View>
                    <View style={[styles.dateTimeContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                        <TouchableOpacity
                            style={[styles.dateTimeButton, isRTL && { flexDirection: 'row-reverse' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={COLORS.turfGreen} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                            <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dateTimeButton, isRTL && { flexDirection: 'row-reverse' }]}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Ionicons name="time-outline" size={20} color={COLORS.turfGreen} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
                            <Text style={styles.dateTimeText}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                    </View>

                    <DateTimePickerModal
                        isVisible={showDatePicker}
                        mode="date"
                        date={date}
                        onConfirm={(selectedDate) => {
                            setDate((prevDate) => {
                                const newDate = new Date(prevDate);
                                newDate.setFullYear(selectedDate.getFullYear());
                                newDate.setMonth(selectedDate.getMonth());
                                newDate.setDate(selectedDate.getDate());
                                return newDate;
                            });
                            setShowDatePicker(false);
                        }}
                        onCancel={() => setShowDatePicker(false)}
                        themeVariant="dark"
                    />

                    <DateTimePickerModal
                        isVisible={showTimePicker}
                        mode="time"
                        date={date}
                        onConfirm={(selectedDate) => {
                            setDate((prevDate) => {
                                const newDate = new Date(prevDate);
                                newDate.setHours(selectedDate.getHours());
                                newDate.setMinutes(selectedDate.getMinutes());
                                return newDate;
                            });
                            setShowTimePicker(false);
                        }}
                        onCancel={() => setShowTimePicker(false)}
                        themeVariant="dark"
                    />

                    <View style={[styles.labelWrapper, { alignItems: 'center' }]}>
                        <Text style={[styles.label, { textAlign: 'center' }]}>{t('create_game.label_description')}</Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.textArea, { textAlign: 'center', width: '100%', marginHorizontal: 0 }]}
                        placeholder={t('create_game.placeholder_description')}
                        placeholderTextColor={COLORS.textTertiary}
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />

                    <PremiumButton
                        title={t('edit_game.save_changes')}
                        onPress={handleUpdate}
                        loading={saving}
                        icon={<Ionicons name="checkmark-circle" size={24} color="white" />}
                        style={styles.submitButtonContainer}
                    />
                </GlassCard>
                <View style={{ height: 100 }} />
            </Animated.View>
        </View>
    );

    return (
        <View style={styles.container}>
            {saving && <LoadingState message={t('common.saving')} />}
            <LinearGradient
                colors={['#050B08', '#00261A', '#004D33']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <FlatList
                data={[{ id: 'edit-form' }]}
                keyExtractor={item => item.id}
                renderItem={() => (
                    <>
                        {renderHeader()}
                        {renderForm()}
                    </>
                )}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
            />

            <FeedbackModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.back();
                }}
                title={t('common.success')}
                message={t('edit_game.success_updated')}
                buttonText={t('common.done')}
            />
            <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} autoStart={false} ref={confettiRef} fadeOut={true} />
        </View>
    );
}

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.darkBackground },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.darkBackground },
    mapContainer: { height: 300, width: '100%', position: 'relative' },
    pinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40 },
    searchPillWrapper: { position: 'absolute', top: 60, left: SPACING.m, right: SPACING.m, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', zIndex: 1000, overflow: 'visible', backgroundColor: 'transparent' },
    searchInput: { backgroundColor: 'transparent', color: 'white', height: 56, fontSize: 16, paddingHorizontal: 20, fontFamily: FONTS.body, borderRadius: 28 },
    searchListView: { backgroundColor: '#0A120E', borderRadius: BORDER_RADIUS.m, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    addressContainer: { position: 'absolute', bottom: 16, left: SPACING.m, right: SPACING.m, alignItems: 'center' },
    addressBlur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.full, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)' },
    addressText: { color: 'white', fontSize: 14, fontWeight: '600', fontFamily: FONTS.body, flexShrink: 1 },
    headerSafeArea: { position: 'absolute', top: 0, left: 0, paddingHorizontal: SPACING.m },
    backButton: { marginTop: SPACING.s },
    backButtonBlur: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    contentContainer: { padding: SPACING.m, marginTop: 20 },
    screenTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', fontFamily: FONTS.heading, marginBottom: SPACING.l, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4, flexWrap: 'wrap' },
    formCard: { padding: SPACING.l, borderRadius: BORDER_RADIUS.xl },
    labelWrapper: { width: '100%', marginBottom: 2 },
    label: { color: COLORS.turfGreen, fontSize: 14, fontWeight: 'bold', marginBottom: SPACING.s, fontFamily: FONTS.body, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: 'transparent', padding: SPACING.m, borderRadius: BORDER_RADIUS.m, marginBottom: SPACING.l, color: 'white', borderWidth: 0, borderColor: 'transparent', fontFamily: FONTS.body, width: '100%' },
    textArea: { height: 100, textAlignVertical: 'top' },
    formatContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.l },
    formatOption: { flex: 1, backgroundColor: 'transparent', paddingVertical: SPACING.m, alignItems: 'center', borderRadius: BORDER_RADIUS.m, marginHorizontal: 4, borderWidth: 0, borderColor: 'transparent' },
    formatItemContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    formatOptionActive: { backgroundColor: COLORS.turfGreen, borderColor: COLORS.turfGreen },
    formatText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
    formatTextActive: { color: 'white' },
    dateTimeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.l },
    dateTimeButton: { flex: 0.48, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', padding: SPACING.m, borderRadius: BORDER_RADIUS.m, borderWidth: 0, borderColor: 'transparent' },
    dateTimeText: { color: 'white', fontSize: 14 },
    submitButtonContainer: { marginTop: SPACING.m, borderRadius: BORDER_RADIUS.l, overflow: 'hidden', height: 56, elevation: 5, shadowColor: COLORS.turfGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    submitButtonGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.l },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: FONTS.heading },
    successButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: FONTS.heading },
});
