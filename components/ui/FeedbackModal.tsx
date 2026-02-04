import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#00D26A',
    primaryDark: '#00A855',
    bgDark: '#0A1A14',
    bgMid: '#0D2818',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    error: '#FF5252',
    errorDark: '#D32F2F',
    warning: '#FF9800',
    warningDark: '#F57C00',
};

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    type?: 'success' | 'error' | 'warning' | 'info';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
    visible,
    onClose,
    title,
    message,
    buttonText = 'אישור',
    secondaryButtonText,
    onSecondaryPress,
    icon,
    type = 'success'
}) => {
    const getTypeConfig = () => {
        switch (type) {
            case 'error':
                return {
                    colors: [COLORS.error, COLORS.errorDark],
                    icon: icon || 'alert-circle',
                    bgColor: 'rgba(255, 82, 82, 0.1)',
                };
            case 'warning':
                return {
                    colors: [COLORS.warning, COLORS.warningDark],
                    icon: icon || 'warning',
                    bgColor: 'rgba(255, 152, 0, 0.1)',
                };
            case 'info':
                return {
                    colors: ['#38BDF8', '#0284C7'],
                    icon: icon || 'information-circle',
                    bgColor: 'rgba(56, 189, 248, 0.1)',
                };
            default:
                return {
                    colors: [COLORS.primary, COLORS.primaryDark],
                    icon: icon || 'checkmark-circle',
                    bgColor: 'rgba(0, 210, 106, 0.1)',
                };
        }
    };

    const config = getTypeConfig();

    const handlePrimaryPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleSecondaryPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSecondaryPress?.();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <Animated.View
                    entering={ZoomIn.springify().damping(15)}
                    style={styles.container}
                >
                    <View style={styles.card}>
                        <LinearGradient
                            colors={[COLORS.bgMid, COLORS.bgDark]}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />

                        {/* Icon */}
                        <View style={[styles.iconWrapper, { backgroundColor: config.bgColor }]}>
                            <LinearGradient
                                colors={config.colors as [string, string]}
                                style={styles.iconGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name={config.icon as any} size={32} color={COLORS.textPrimary} />
                            </LinearGradient>
                        </View>

                        {/* Content */}
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            {secondaryButtonText && (
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleSecondaryPress}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.primaryButton, !secondaryButtonText && styles.fullWidthButton]}
                                onPress={handlePrimaryPress}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={config.colors as [string, string]}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.primaryButtonText}>{buttonText}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

// Custom Alert replacement - use this instead of Alert.alert
export const showAlert = (
    setModalState: React.Dispatch<React.SetStateAction<AlertState>>,
    config: Omit<AlertState, 'visible'>
) => {
    setModalState({ ...config, visible: true });
};

export interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttonText?: string;
    secondaryButtonText?: string;
    onClose?: () => void;
    onSecondaryPress?: () => void;
}

export const initialAlertState: AlertState = {
    visible: false,
    title: '',
    message: '',
    type: 'success',
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    container: {
        width: width - 48,
        maxWidth: 380,
    },
    card: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
    },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    iconGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row-reverse',
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        overflow: 'hidden',
    },
    fullWidthButton: {
        flex: 1,
    },
    buttonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.bgDark,
    },
    secondaryButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
});
