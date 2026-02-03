import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
                <View style={styles.tabBar}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        let label = '';
                        if (route.name === 'index') label = t('tabs.home');
                        if (route.name === 'explore') label = t('tabs.explore');
                        if (route.name === 'chats') label = t('tabs.chats');
                        if (route.name === 'profile') label = t('tabs.profile');

                        return (
                            <TabIcon
                                key={index}
                                isFocused={isFocused}
                                onPress={onPress}
                                routeName={route.name}
                                label={label}
                            />
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const TabIcon = ({ isFocused, onPress, routeName, label }: { isFocused: boolean; onPress: () => void; routeName: string; label: string }) => {
    const scale = useSharedValue(1);

    React.useEffect(() => {
        scale.value = withSpring(isFocused ? 1.2 : 1);
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    let iconName: keyof typeof Ionicons.glyphMap = 'home';
    if (routeName === 'index') iconName = isFocused ? 'map' : 'map-outline';
    if (routeName === 'chats') iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
    if (routeName === 'profile') iconName = isFocused ? 'person' : 'person-outline';
    if (routeName === 'explore') iconName = isFocused ? 'compass' : 'compass-outline';

    return (
        <TouchableOpacity onPress={onPress} style={styles.tabButton}>
            <Animated.View style={[animatedStyle, isFocused && styles.activeTab]}>
                <Ionicons
                    name={iconName}
                    size={24}
                    color={isFocused ? COLORS.accentOrange : COLORS.textSecondary}
                />
            </Animated.View>
            {isFocused && (
                <Text style={styles.tabLabel}>{label}</Text>
            )}
            {isFocused && (
                <Animated.View style={styles.activeDot} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 32,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    blurContainer: {
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        width: '100%',
        ...SHADOWS.glass,
    },
    tabBar: {
        flexDirection: 'row',
        height: 70,
        backgroundColor: 'rgba(10, 14, 12, 0.6)',
        justifyContent: 'space-around',
        alignItems: 'center',
        direction: 'ltr',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    activeTab: {
        shadowColor: COLORS.accentOrange,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.accentOrange,
        marginTop: 4,
    },
    tabLabel: {
        color: COLORS.accentOrange,
        fontSize: 10,
        fontFamily: FONTS.body,
        marginTop: 2,
    }
});
