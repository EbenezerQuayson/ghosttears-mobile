import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>GHOSTTEARS</Text>
                <Text style={styles.subtitle}>Mobile</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Setup', { mode: 'single' })}
                >
                    <Text style={styles.buttonText}>Single Player (vs Bot)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => navigation.navigate('Setup', { mode: 'host' })}
                >
                    <Text style={styles.buttonText}>Host Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Lobby', { mode: 'join' })}
                >
                    <Text style={styles.buttonText}>Join Game</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        marginBottom: 60,
        alignItems: 'center',
    },
    title: {
        color: '#ffffff',
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: 6,
    },
    subtitle: {
        color: '#ff3333',
        fontSize: 18,
        letterSpacing: 4,
        marginTop: 8,
    },
    buttonContainer: {
        width: '80%',
    },
    button: {
        backgroundColor: '#1f1f1f',
        paddingVertical: 16,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333333',
    },
    primaryButton: {
        borderColor: '#ff3333',
        backgroundColor: '#1a0000',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
