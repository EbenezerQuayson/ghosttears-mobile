import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function Board({ fragment, gameState }) {
    return (
        <View style={styles.container}>
            <Text style={styles.fragmentText}>
                {fragment || '—'}
            </Text>
            {gameState === 'game_over' && (
                <View style={styles.gameOverBadge}>
                    <Text style={styles.badgeText}>GAME OVER</Text>
                </View>
            )}
            {gameState === 'challenged' && (
                <View style={styles.challengeBadge}>
                    <Text style={styles.badgeText}>CHALLENGED!</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    fragmentText: {
        color: '#3B332B',
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: 6,
        textAlign: 'center',
        textTransform: 'uppercase',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    gameOverBadge: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#FF4757',
        borderBottomWidth: 3,
        borderBottomColor: '#D63031',
    },
    challengeBadge: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#FFA114',
        borderBottomWidth: 3,
        borderBottomColor: '#D77500',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
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
