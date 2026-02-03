import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { Profile } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FIELD_PADDING = 20;
const FIELD_WIDTH = SCREEN_WIDTH - (FIELD_PADDING * 2);
const FIELD_HEIGHT = FIELD_WIDTH * 1.5;

type Participant = {
    user_id: string;
    lineup_position_id?: string;
    profiles: Profile;
};

type Position = {
    id: string;
    top: number; // percentage
    left: number; // percentage
    label: string;
};

const FORMATIONS: Record<string, Position[]> = {
    '5v5': [
        { id: 't1_gk', top: 5, left: 50, label: 'GK' },
        { id: 't1_d1', top: 20, left: 25, label: 'DEF' },
        { id: 't1_d2', top: 20, left: 75, label: 'DEF' },
        { id: 't1_m1', top: 35, left: 50, label: 'MID' },
        { id: 't1_f1', top: 45, left: 50, label: 'FWD' },
        // Team 2
        { id: 't2_f1', top: 55, left: 50, label: 'FWD' },
        { id: 't2_m1', top: 65, left: 50, label: 'MID' },
        { id: 't2_d1', top: 80, left: 25, label: 'DEF' },
        { id: 't2_d2', top: 80, left: 75, label: 'DEF' },
        { id: 't2_gk', top: 95, left: 50, label: 'GK' },
    ],
    '7v7': [
        { id: 't1_gk', top: 5, left: 50, label: 'GK' },
        { id: 't1_d1', top: 20, left: 20, label: 'DEF' },
        { id: 't1_d2', top: 20, left: 50, label: 'DEF' },
        { id: 't1_d3', top: 20, left: 80, label: 'DEF' },
        { id: 't1_m1', top: 35, left: 30, label: 'MID' },
        { id: 't1_m2', top: 35, left: 70, label: 'MID' },
        { id: 't1_f1', top: 45, left: 50, label: 'FWD' },
        // Team 2
        { id: 't2_f1', top: 55, left: 50, label: 'FWD' },
        { id: 't2_m1', top: 65, left: 30, label: 'MID' },
        { id: 't2_m2', top: 65, left: 70, label: 'MID' },
        { id: 't2_d1', top: 80, left: 20, label: 'DEF' },
        { id: 't2_d2', top: 80, left: 50, label: 'DEF' },
        { id: 't2_d3', top: 80, left: 80, label: 'DEF' },
        { id: 't2_gk', top: 95, left: 50, label: 'GK' },
    ],
    '11v11': [
        { id: 't1_gk', top: 5, left: 50, label: 'GK' },
        { id: 't1_d1', top: 18, left: 15, label: 'LB' },
        { id: 't1_d2', top: 18, left: 38, label: 'CB' },
        { id: 't1_d3', top: 18, left: 62, label: 'CB' },
        { id: 't1_d4', top: 18, left: 85, label: 'RB' },
        { id: 't1_m1', top: 32, left: 25, label: 'MID' },
        { id: 't1_m2', top: 32, left: 50, label: 'MID' },
        { id: 't1_m3', top: 32, left: 75, label: 'MID' },
        { id: 't1_f1', top: 43, left: 20, label: 'LW' },
        { id: 't1_f2', top: 43, left: 50, label: 'ST' },
        { id: 't1_f3', top: 43, left: 80, label: 'RW' },
        // Team 2
        { id: 't2_f1', top: 57, left: 20, label: 'LW' },
        { id: 't2_f2', top: 57, left: 50, label: 'ST' },
        { id: 't2_f3', top: 57, left: 80, label: 'RW' },
        { id: 't2_m1', top: 68, left: 25, label: 'MID' },
        { id: 't2_m2', top: 68, left: 50, label: 'MID' },
        { id: 't2_m3', top: 68, left: 75, label: 'MID' },
        { id: 't2_d1', top: 82, left: 15, label: 'LB' },
        { id: 't2_d2', top: 82, left: 38, label: 'CB' },
        { id: 't2_d3', top: 82, left: 62, label: 'CB' },
        { id: 't2_d4', top: 82, left: 85, label: 'RB' },
        { id: 't2_gk', top: 95, left: 50, label: 'GK' },
    ]
};

interface SoccerFieldProps {
    format: string;
    participants: Participant[];
    currentUserId?: string;
    onPickPosition: (positionId: string) => void;
    isRTL: boolean;
}

export const SoccerField: React.FC<SoccerFieldProps> = ({ format, participants, currentUserId, onPickPosition, isRTL }) => {
    const positions = FORMATIONS[format] || FORMATIONS['5v5'];

    const getOccupant = (posId: string) => {
        return participants.find(p => p.lineup_position_id === posId);
    };

    return (
        <View style={styles.container}>
            <View style={styles.fieldBody}>
                {/* Field Lines */}
                <View style={styles.centerLine} />
                <View style={styles.centerCircle} />
                <View style={styles.topBox} />
                <View style={[styles.topBox, styles.bottomBox]} />

                {/* Positions */}
                {positions.map((pos) => {
                    const occupant = getOccupant(pos.id);
                    const isMe = occupant?.user_id === currentUserId;

                    return (
                        <TouchableOpacity
                            key={pos.id}
                            style={[
                                styles.positionSpot,
                                { top: `${pos.top}%`, left: `${pos.left}%` },
                                occupant && styles.positionOccupied,
                                isMe && styles.positionMe
                            ]}
                            onPress={() => onPickPosition(pos.id)}
                            disabled={!!occupant && !isMe}
                        >
                            {occupant ? (
                                <View style={styles.occupantContainer}>
                                    <View style={styles.avatarMini}>
                                        <Text style={styles.avatarText}>
                                            {occupant.profiles?.full_name?.charAt(0)}
                                        </Text>
                                    </View>
                                    <Text style={styles.occupantName} numberOfLines={1}>
                                        {isMe ? 'Me' : occupant.profiles?.full_name?.split(' ')[0]}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.positionLabel}>{pos.label}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.turfGreen }]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: 'white' }]} />
                    <Text style={styles.legendText}>Occupied</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.accentOrange }]} />
                    <Text style={styles.legendText}>You</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: FIELD_WIDTH,
        alignSelf: 'center',
        marginVertical: 20,
    },
    fieldBody: {
        width: FIELD_WIDTH,
        height: FIELD_HEIGHT,
        backgroundColor: '#1B4D3E',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        position: 'relative',
        overflow: 'hidden',
    },
    centerLine: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    centerCircle: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        marginLeft: -40,
        marginTop: -40,
    },
    topBox: {
        position: 'absolute',
        top: 0,
        left: '25%',
        width: '50%',
        height: '10%',
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    bottomBox: {
        top: undefined,
        bottom: 0,
        borderBottomWidth: 0,
        borderTopWidth: 2,
    },
    positionSpot: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 2,
        borderColor: COLORS.turfGreen,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -22,
        marginTop: -22,
        zIndex: 10,
    },
    positionOccupied: {
        backgroundColor: 'white',
        borderColor: 'white',
    },
    positionMe: {
        borderColor: COLORS.accentOrange,
        borderWidth: 3,
        shadowColor: COLORS.accentOrange,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
    },
    positionLabel: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    occupantContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarMini: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.turfGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    occupantName: {
        position: 'absolute',
        top: 45,
        color: 'white',
        fontSize: 9,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 4,
        borderRadius: 4,
        width: 60,
        textAlign: 'center',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
});
