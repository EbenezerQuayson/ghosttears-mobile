import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const PENALTY_WORD = 'GHOSTTEARS';

// A dynamic table to show current penalties for each player
export default function Scoreboard({ players }) {
    // players array structure: [{ id: 'host', label: 'Player 1', score: 0 }]

    const AnimatedLetter = ({ char, isActive, isNew }) => {
        const scale = useSharedValue(1);
        const opacity = useSharedValue(isActive ? 1 : 0.3);

        useEffect(() => {
            if (isNew && isActive) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Glitch Sequence
                scale.value = withSequence(
                    withSpring(1.5, { damping: 2, stiffness: 80 }),
                    withTiming(1, { duration: 200 })
                );
            }
        }, [isActive, isNew]);

        const animatedStyle = useAnimatedStyle(() => {
            return {
                transform: [{ scale: scale.value }],
            };
        });

        return (
            <Animated.View style={[styles.letterSlot, isActive ? styles.activeSlot : styles.inactiveSlot, animatedStyle]}>
                <Text style={[styles.letterText, isActive ? styles.activeText : styles.inactiveText]}>
                    {char}
                </Text>
            </Animated.View>
        );
    };

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
                        const isActive = index < p.score;
                        const isNew = index === p.score - 1; // It's the most recently added letter
                        return (
                            <AnimatedLetter
                                key={`${p.id}-${index}`}
                                char={char}
                                isActive={isActive}
                                isNew={isNew}
                            />
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
        backgroundColor: '#0f0f0f',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        width: '100%',
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
        backgroundColor: '#ff333333', // Slight red background
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#ff3333',
    },
    inactiveSlot: {
        backgroundColor: 'transparent',
    },
    letterText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    activeText: {
        color: '#ff3333',
    },
    inactiveText: {
        color: '#333333', // Dim gray when not active
    }
});
