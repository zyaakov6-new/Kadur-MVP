import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { PremiumButton } from './PremiumButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    buttonTitle?: string;
    onButtonPress?: () => void;
    buttonIcon?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    message,
    buttonTitle,
    onButtonPress,
    buttonIcon
}) => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <Animated.View
                entering={FadeInDown.springify()}
                style={styles.content}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={64} color={COLORS.turfGreen} />
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                {buttonTitle && onButtonPress && (
                    <PremiumButton
                        title={buttonTitle}
                        onPress={onButtonPress}
                        icon={buttonIcon ? <Ionicons name={buttonIcon} size={20} color="white" /> : undefined}
                        style={styles.button}
                    />
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        marginTop: 40,
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(74, 175, 87, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(74, 175, 87, 0.2)',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: FONTS.heading,
        textAlign: 'center',
        marginBottom: SPACING.s,
    },
    message: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
        lineHeight: 24,
        opacity: 0.8,
    },
    button: {
        width: '100%',
        height: 56,
    }
});
