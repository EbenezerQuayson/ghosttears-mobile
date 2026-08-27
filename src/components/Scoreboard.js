import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PENALTY_WORD = 'GHOSTTEARS';

// A dynamic table to show current penalties for each player
export default function Scoreboard({ players }) {
    return (
        <View style={styles.container}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.playerColumnHeader}>
                    <Text style={styles.headerText}>Players</Text>
                </View>
                {PENALTY_WORD.split('').map((char, index) => (
                    <View key={`header-${index}`} style={styles.letterSlot}>
                        <Text style={styles.headerText}>{char}</Text>
                    </View>
                ))}
            </View>

            {/* Player Rows */}
            {players.map((p) => (
                <View key={p.id} style={styles.playerRow}>
                    <View style={styles.playerColumn}>
                        <Text style={styles.playerLabel}>{p.label}</Text>
                    </View>
                    {PENALTY_WORD.split('').map((char, index) => {
                        const hasLetter = index < p.score;
                        return (
                            <View
                                key={`${p.id}-${index}`}
                                style={[styles.letterSlot, hasLetter ? styles.activeSlot : styles.inactiveSlot]}
                            >
                                <Text style={[styles.letterText, hasLetter ? styles.activeText : styles.inactiveText]}>
                                    {char}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#18152E',
        borderBottomWidth: 1,
        borderBottomColor: '#252243',
        width: '100%',
        borderRadius: 20,
        marginTop: 10,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    playerRow: {
        flexDirection: 'row',
        marginBottom: 6,
        alignItems: 'center',
    },
    playerColumnHeader: {
        width: 60,
        marginRight: 8,
        alignItems: 'flex-start',
    },
    playerColumn: {
        width: 60,
        marginRight: 8,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerText: {
        color: '#888888',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    playerLabel: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    letterSlot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 24,
        marginHorizontal: 1,
    },
    activeSlot: {
        backgroundColor: '#FFC10733', // 20% opacity gold
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    inactiveSlot: {
        backgroundColor: 'transparent',
    },
    letterText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    activeText: {
        color: '#FFC107', // Bright Gold
    },
    inactiveText: {
        color: '#333333',
    }
});
