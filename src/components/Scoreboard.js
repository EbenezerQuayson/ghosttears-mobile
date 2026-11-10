import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const PENALTY_WORD = 'GHOSTTEARS';

export default function Scoreboard({ players }) {
    return (
        <View style={styles.container}>
            {/* Header Title Row */}
            <View style={styles.headerRow}>
                <View style={styles.playerColumnHeader}>
                    <Text style={styles.headerText}>PLAYER</Text>
                </View>
                <View style={styles.slotsRow}>
                    {PENALTY_WORD.split('').map((char, index) => (
                        <View key={`header-${index}`} style={styles.headerSlot}>
                            <Text style={styles.headerChar}>{char}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Players Rows */}
            {players.map((p) => {
                return (
                    <View key={p.id} style={styles.playerRow}>
                        <View style={styles.playerColumn}>
                            <Text style={styles.heartIcon}>♥</Text>
                            <Text style={styles.playerName} numberOfLines={1}>
                                {p.label}
                            </Text>
                        </View>
                        <View style={styles.slotsRow}>
                            {PENALTY_WORD.split('').map((char, index) => {
                                const hasLetter = index < p.score;
                                return (
                                    <View
                                        key={`${p.id}-${index}`}
                                        style={[
                                            styles.slot,
                                            hasLetter ? styles.slotActive : styles.slotInactive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.slotText,
                                            hasLetter ? styles.slotTextActive : styles.slotTextInactive
                                        ]}>
                                            {char}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 2,
        borderColor: '#E8E1CF',
        borderBottomWidth: 5,
        borderBottomColor: '#D8D0BC',
        marginVertical: 6,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 6,
        marginBottom: 6,
        borderBottomWidth: 2,
        borderBottomColor: '#F0E9DC',
    },
    playerColumnHeader: {
        width: 76,
    },
    headerText: {
        color: '#A89E8D',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    headerSlot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerChar: {
        color: '#B5ABA0',
        fontSize: 11,
        fontWeight: '900',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    playerColumn: {
        width: 76,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingRight: 4,
    },
    heartIcon: {
        color: '#FF4757',
        fontSize: 12,
        fontWeight: '900',
    },
    playerName: {
        color: '#4A3E3D',
        fontSize: 12,
        fontWeight: '800',
        flex: 1,
    },
    slotsRow: {
        flex: 1,
        flexDirection: 'row',
        gap: 3,
    },
    slot: {
        flex: 1,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    slotInactive: {
        backgroundColor: '#F5EFE3',
        borderWidth: 1,
        borderColor: '#E8E0D0',
        borderBottomWidth: 2,
        borderBottomColor: '#DAD1BF',
    },
    slotActive: {
        backgroundColor: '#FF4757',
        borderBottomWidth: 3,
        borderBottomColor: '#D63031',
    },
    slotText: {
        fontSize: 12,
        fontWeight: '900',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    slotTextInactive: {
        color: '#C7BEAF',
    },
    slotTextActive: {
        color: '#FFFFFF',
        ...Platform.select({
            web: { textShadow: '0px 1px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
            }
        }),
    }
});
