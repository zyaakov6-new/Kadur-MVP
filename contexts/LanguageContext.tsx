import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import i18n from '../i18n';

type LanguageContextType = {
    language: string;
    changeLanguage: (lang: string) => Promise<void>;
    isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    changeLanguage: async () => { },
    isRTL: false,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState(i18n.language || 'en');
    const [isRTL, setIsRTL] = useState(i18n.language === 'he');

    useEffect(() => {
        // Enforce LTR mode natively, relying on manual styles for RTL support
        // This prevents "double-flipping" issues when switching languages without reload
        if (I18nManager.isRTL) {
            I18nManager.allowRTL(false);
            I18nManager.forceRTL(false);
        }

        const handleLanguageChange = (lng: string) => {
            setLanguage(lng);
            setIsRTL(lng === 'he');
        };

        i18n.on('languageChanged', handleLanguageChange);

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);

    const changeLanguage = async (lang: string) => {
        await i18n.changeLanguage(lang);
        setLanguage(lang);

        // Ensure native LTR is enforced (just in case)
        if (I18nManager.isRTL) {
            I18nManager.allowRTL(false);
            I18nManager.forceRTL(false);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};
