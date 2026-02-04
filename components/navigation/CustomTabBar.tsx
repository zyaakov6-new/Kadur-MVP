import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Vibrant color palette matching the app
const COLORS = {
    primary: '#00D26A',
    primaryDark: '#00A855',
    bgDark: '#0A1A14',
    bgMid: '#0D2818',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
};

// Hebrew labels
const TAB_LABELS: Record<string, string> = {
    index: 'בית',
    explore: 'חיפוש',
    chats: 'צ׳אטים',
    profile: 'פרופיל',
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.tabBarWrapper}>
                <LinearGradient
                    colors={['rgba(13, 40, 24, 0.95)', 'rgba(10, 26, 20, 0.98)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
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

                        const label = TAB_LABELS[route.name] || route.name;

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
            { scale: interpolate(progress.value, [0, 1], [1, 1.1]) },
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
        opacity: interpolate(progress.value, [0, 1], [0.5, 1]),
        transform: [
            { translateY: interpolate(progress.value, [0, 1], [2, 0]) },
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
                {/* Active background pill with gradient */}
                <Animated.View style={[styles.activeBackground, animatedBackgroundStyle]}>
                    <LinearGradient
                        colors={['rgba(0, 210, 106, 0.2)', 'rgba(0, 210, 106, 0.08)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <Animated.View style={animatedIconStyle}>
                    <Ionicons
                        name={iconName}
                        size={24}
                        color={isFocused ? COLORS.primary : COLORS.textSecondary}
                    />
                </Animated.View>

                <Animated.Text style={[
                    styles.tabLabel,
                    isFocused && styles.tabLabelActive,
                    animatedLabelStyle
                ]}>
                    {label}
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 24 : 16,
        left: 16,
        right: 16,
        alignItems: 'center',
    },
    tabBarWrapper: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    tabBar: {
        flexDirection: 'row',
        height: 70,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 8,
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
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 64,
    },
    activeBackground: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        overflow: 'hidden',
    },
    tabLabel: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    tabLabelActive: {
        color: COLORS.primary,
    },
});
