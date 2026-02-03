import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { GlassCard } from './GlassCard';
import { useLanguage } from '../../contexts/LanguageContext';

interface CityDropdownProps {
    options: string[];
    selectedOption: string;
    onSelect: (option: string) => void;
    label?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

import { useTranslation } from 'react-i18next';

export const CityDropdown: React.FC<CityDropdownProps> = ({ options, selectedOption, onSelect, label }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const [visible, setVisible] = useState(false);
    const [dropdownTop, setDropdownTop] = useState(0);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [dropdownWidth, setDropdownWidth] = useState(0);
    const buttonRef = useRef<View>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const openDropdown = () => {
        buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
            let finalWidth = Math.max(width, 180);
            let finalLeft = pageX;

            if (isRTL) {
                // In RTL, we want the right edge of the dropdown to align with the right edge of the button
                // pageX is the left position of the button
                // pageX + width is the right position of the button
                // So we want: dropdownLeft + dropdownWidth = buttonRight
                finalLeft = pageX + width - finalWidth;
            }

            setDropdownTop(pageY + height + 4);
            setDropdownLeft(finalLeft);
            setDropdownWidth(finalWidth);
            setVisible(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const closeDropdown = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const handleSelect = (option: string) => {
        onSelect(option);
        closeDropdown();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                ref={buttonRef}
                style={[styles.button, visible && styles.buttonActive]}
                onPress={visible ? closeDropdown : openDropdown}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText} numberOfLines={1}>
                    {selectedOption === 'All' ? label : selectedOption}
                </Text>
                <Ionicons
                    name={visible ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={visible ? COLORS.textPrimary : COLORS.textSecondary}
                />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="none">
                <TouchableWithoutFeedback onPress={closeDropdown}>
                    <View style={styles.overlay}>
                        <Animated.View
                            style={[
                                styles.dropdown,
                                {
                                    top: dropdownTop,
                                    left: dropdownLeft,
                                    width: dropdownWidth,
                                    opacity: fadeAnim
                                }
                            ]}
                        >
                            <GlassCard style={styles.glassContainer} intensity={80}>
                                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                                    <TouchableOpacity
                                        style={[styles.option, selectedOption === 'All' && styles.selectedOption, isRTL && { flexDirection: 'row-reverse' }]}
                                        onPress={() => handleSelect('All')}
                                    >
                                        <Text style={[styles.optionText, selectedOption === 'All' && styles.selectedOptionText]}>{t('explore.filter_all')}</Text>
                                        {selectedOption === 'All' && <Ionicons name="checkmark" size={16} color={COLORS.turfGreen} />}
                                    </TouchableOpacity>

                                    {options.map((option, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.option, selectedOption === option && styles.selectedOption, isRTL && { flexDirection: 'row-reverse' }]}
                                            onPress={() => handleSelect(option)}
                                        >
                                            <Text style={[styles.optionText, selectedOption === option && styles.selectedOptionText]}>{option}</Text>
                                            {selectedOption === option && <Ionicons name="checkmark" size={16} color={COLORS.turfGreen} />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </GlassCard>
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginRight: SPACING.s,
        // ensure z-index in parent context if needed, but Modal handles generic overlay
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minWidth: 100,
        justifyContent: 'space-between',
    },
    buttonActive: {
        borderColor: COLORS.turfGreen,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    buttonText: {
        color: COLORS.textPrimary,
        fontFamily: FONTS.body,
        fontWeight: '500',
        fontSize: 14,
        marginRight: 8,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)', // dim background slightly
    },
    dropdown: {
        position: 'absolute',
        maxWidth: 240,
        maxHeight: 250,
        zIndex: 1000,
    },
    glassContainer: {
        padding: 0,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    scroll: {
        maxHeight: 300,
    },
    option: {
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedOption: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    optionText: {
        color: COLORS.textSecondary,
        fontFamily: FONTS.body,
        fontSize: 14,
    },
    selectedOptionText: {
        color: COLORS.turfGreen,
        fontFamily: FONTS.heading,
        fontWeight: 'bold',
    },
});
