import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Board({ fragment, gameState }) {
    return (
        <View style={styles.container}>
            <Text style={styles.fragmentText}>
                {fragment || ' '}
            </Text>
            {gameState === 'game_over' && (
                <Text style={styles.gameOverText}>GAME OVER</Text>
            )}
            {gameState === 'challenged' && (
                <Text style={styles.challengeText}>CHALLENGED!</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fragmentText: {
        color: '#ffffff',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 8,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    gameOverText: {
        color: '#ff3333',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        letterSpacing: 4,
    },
    challengeText: {
        color: '#ffaa00',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        letterSpacing: 2,
    }
});
