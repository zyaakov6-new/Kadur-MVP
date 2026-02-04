import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Share, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { FeedbackModal, AlertState } from './FeedbackModal';

interface ShareButtonProps {
    message: string;
    url?: string;
    title?: string;
    style?: ViewStyle;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ message, url, title = 'Share Game', style }) => {
    const { t } = useTranslation();
    const [errorAlert, setErrorAlert] = useState<AlertState>({ visible: false, title: '', message: '' });

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: message + (url ? `\n\n${url}` : ''),
                url: url, // iOS only
                title: title, // Android only
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
        } catch (error: any) {
            setErrorAlert({
                visible: true,
                title: t('common.error'),
                message: error.message,
                type: 'error'
            });
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={handleShare}
                style={[styles.container, style]}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="share-outline" size={18} color="white" style={styles.icon} />
                    <Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>{t('game.share')}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <FeedbackModal
                visible={errorAlert.visible}
                onClose={() => setErrorAlert({ ...errorAlert, visible: false })}
                title={errorAlert.title}
                message={errorAlert.message}
                buttonText={t('common.ok')}
                type={errorAlert.type || 'error'}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        minWidth: 130,
        maxWidth: 150,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: FONTS.body,
    },
});
