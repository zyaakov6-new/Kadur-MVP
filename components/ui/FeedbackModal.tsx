import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from './GlassCard';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText: string;
    icon?: keyof typeof Ionicons.prototype.props.name;
    type?: 'success' | 'error';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
    visible,
    onClose,
    title,
    message,
    buttonText,
    icon,
    type = 'success'
}) => {
    const isError = type === 'error';
    const defaultIcon = isError ? "alert-circle" : "checkmark-circle";
    const accentColor = isError ? "#ef4444" : "#4CAF57";
    const accentSecondary = isError ? "#b91c1c" : "#2E7D32";

    const iconAnimStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: withDelay(300, withSequence(withTiming(1.2), withTiming(1))) },
            { rotate: withDelay(300, withSequence(withTiming('10deg'), withTiming('0deg'))) }
        ],
    }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.dismissArea}
                    onPress={onClose}
                />

                <Animated.View
                    entering={ZoomIn}
                    style={styles.modalContainer}
                >
                    <GlassCard style={styles.modalCard} intensity={40}>
                        <LinearGradient
                            colors={[`${accentColor}33`, 'transparent']}
                            style={styles.headerGradient}
                        />

                        <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
                            <View style={styles.centerContent}>
                                <LinearGradient
                                    colors={[accentColor, accentSecondary]}
                                    style={styles.iconCircle}
                                >
                                    <Ionicons name={(icon || defaultIcon) as any} size={56} color="white" />
                                </LinearGradient>
                            </View>
                        </Animated.View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={onClose}>
                                <LinearGradient
                                    colors={[accentColor, accentSecondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>{buttonText}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    dismissArea: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        width: '90%',
        maxWidth: 420,
    },
    modalCard: {
        paddingVertical: SPACING.xxl,
        paddingHorizontal: 0,
        // Removed alignItems: 'center' to allow full width stretching
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        opacity: 0.5,
    },
    iconContainer: {
        marginBottom: SPACING.l,
    },
    iconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        fontFamily: FONTS.heading,
        marginBottom: SPACING.m,
        letterSpacing: 0.5,
        paddingHorizontal: SPACING.l,
    },
    message: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontFamily: FONTS.body,
        lineHeight: 24,
        marginBottom: SPACING.xxl,
        paddingHorizontal: SPACING.l,
    },
    button: {
        width: '100%',
        height: 64,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
        marginTop: SPACING.s,
        alignSelf: 'center',
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: SPACING.l,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONTS.heading,
    },
    centerContent: {
        alignItems: 'center',
        width: '100%',
    },
});
