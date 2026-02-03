import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

import en from './en.json';
import he from './he.json';

const RESOURCES = {
    en: { translation: en },
    he: { translation: he },
};

const LANGUAGE_DETECTOR = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            const storedLanguage = await AsyncStorage.getItem('user-language');
            if (storedLanguage) {
                return callback(storedLanguage);
            }
        } catch (error) {
            console.log('Error reading language', error);
        }

        // Default to device locale or English
        const deviceLang = Localization.getLocales()[0].languageCode;
        callback(deviceLang === 'he' ? 'he' : 'en');
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('user-language', language);

            // Handle RTL layout
            const isRTL = language === 'he';
            if (I18nManager.isRTL !== isRTL) {
                I18nManager.allowRTL(isRTL);
                I18nManager.forceRTL(isRTL);
                // Note: App reload is usually required for RTL changes to fully take effect
            }
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources: RESOURCES,
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    })
    .catch((err) => {
        console.error('i18n initialization error:', err);
    });

// Async language detection after initialization
(async () => {
    try {
        const storedLanguage = await AsyncStorage.getItem('user-language');
        if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'he')) {
            await i18n.changeLanguage(storedLanguage);
        } else {
            const deviceLang = Localization.getLocales()[0].languageCode;
            if (deviceLang === 'he') {
                await i18n.changeLanguage('he');
            }
        }
    } catch (error) {
        console.log('Error loading language preference:', error);
    }
})();

export default i18n;
