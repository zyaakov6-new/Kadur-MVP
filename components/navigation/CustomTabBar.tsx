import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, BORDER_RADIUS, SHADOWS, FONTS, SPACING } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <View style={styles.shadowContainer}>
                <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                    <LinearGradient
                        colors={['rgba(15, 25, 20, 0.92)', 'rgba(10, 18, 14, 0.95)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Top border highlight */}
                    <View style={styles.topBorder} />
                    <View style={styles.tabBar}>
                        {state.routes.map((route, index) => {
                            const isFocused = state.index === index;

                            const onPress = () => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        </View>
    );
};

const TabIcon = ({
    isFocused,
    onPress,
    routeName,
    label
}: {
    isFocused: boolean;
    onPress: () => void;
    routeName: string;
    label: string;
}) => {
    const progress = useSharedValue(isFocused ? 1 : 0);
    const scale = useSharedValue(1);

    React.useEffect(() => {
        progress.value = withSpring(isFocused ? 1 : 0, {
            damping: 15,
            stiffness: 200,
        });
    }, [isFocused]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: interpolate(progress.value, [0, 1], [1, 1.15]) },
            { translateY: interpolate(progress.value, [0, 1], [0, -2]) },
        ],
    }));

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: interpolate(progress.value, [0, 1], [0.8, 1]) }],
    }));

    const animatedLabelStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            { translateY: interpolate(progress.value, [0, 1], [5, 0]) },
            { scale: interpolate(progress.value, [0, 1], [0.8, 1]) },
        ],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    let iconName: keyof typeof Ionicons.glyphMap = 'home';
    if (routeName === 'index') iconName = isFocused ? 'home' : 'home-outline';
    if (routeName === 'explore') iconName = isFocused ? 'compass' : 'compass-outline';
    if (routeName === 'chats') iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
    if (routeName === 'profile') iconName = isFocused ? 'person' : 'person-outline';

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={styles.tabButton}
        >
            <Animated.View style={[styles.tabContent, animatedContainerStyle]}>
                {/* Active background pill */}
                <Animated.View style={[styles.activeBackground, animatedBackgroundStyle]}>
                    <LinearGradient
                        colors={['rgba(0, 135, 90, 0.2)', 'rgba(0, 135, 90, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <Animated.View style={animatedIconStyle}>
                    <Ionicons
                        name={iconName}
                        size={22}
                        color={isFocused ? COLORS.turfGreenLight : COLORS.textTertiary}
                    />
                </Animated.View>

                <Animated.Text style={[styles.tabLabel, animatedLabelStyle]}>
                    {label}
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 20,
        left: SPACING.m,
        right: SPACING.m,
        alignItems: 'center',
    },
    shadowContainer: {
        width: '100%',
        borderRadius: BORDER_RADIUS.xl,
        ...SHADOWS.glass,
    },
    blurContainer: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    topBorder: {
        position: 'absolute',
        top: 0,
        left: SPACING.xl,
        right: SPACING.xl,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabBar: {
        flexDirection: 'row',
        height: 68,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: SPACING.s,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        minWidth: 60,
    },
    activeBackground: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    tabLabel: {
        color: COLORS.turfGreenLight,
        fontSize: 10,
        fontWeight: '600',
        fontFamily: FONTS.body,
        marginTop: 4,
        letterSpacing: 0.3,
    },
});
