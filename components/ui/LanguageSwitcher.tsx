import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

export const LanguageSwitcher: React.FC = () => {
    const { language, changeLanguage } = useLanguage();

    return (
        <BlurView intensity={30} tint="dark" style={styles.container}>
            <TouchableOpacity
                style={[styles.langButton, language === 'en' && styles.langButtonActive]}
                onPress={() => changeLanguage('en')}
            >
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
                style={[styles.langButton, language === 'he' && styles.langButtonActive]}
                onPress={() => changeLanguage('he')}
            >
                <Text style={[styles.langText, language === 'he' && styles.langTextActive]}>HE</Text>
            </TouchableOpacity>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    langButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        minWidth: 50,
        alignItems: 'center',
    },
    langButtonActive: {
        backgroundColor: COLORS.turfGreen,
    },
    langText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: 'bold',
    },
    langTextActive: {
        color: 'white',
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 2,
    },
});
