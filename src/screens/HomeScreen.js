import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                
                {/* Minimal Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>GHOSTTEARS</Text>
                    <Text style={styles.subtitle}>A competitive word survival game.</Text>
                </View>

                {/* Minimal Entry Points */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={() => navigation.navigate('Setup', { mode: 'single' })}
                    >
                        <Text style={[styles.buttonText, { color: '#18152E' }]}>Play Solo</Text>
                        <Text style={[styles.buttonSubText, { color: '#886b03' }]}>vs AI Bot</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => navigation.navigate('Setup', { mode: 'host' })}
                    >
                        <Text style={styles.buttonText}>Host Game</Text>
                        <Text style={styles.buttonSubText}>Create Room</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.outlineButton]}
                        onPress={() => navigation.navigate('Lobby', { mode: 'join' })}
                    >
                        <Text style={styles.buttonText}>Join Game</Text>
                        <Text style={styles.buttonSubText}>Enter Code</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        marginBottom: 60,
        alignItems: 'center',
    },
    title: {
        color: '#ffffff',
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: 6,
        textAlign: 'center',
        ...Platform.select({
            web: {
                backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #A5B4FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }
        })
    },
    subtitle: {
        color: '#8B5CF6',
        fontSize: 16,
        letterSpacing: 1,
        marginTop: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 20,
    },
    button: {
        width: '100%',
        paddingVertical: 20,
        paddingHorizontal: 25,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        ...Platform.select({
            web: {
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                ':hover': {
                    transform: 'translateY(-2px)',
                }
            }
        })
    },
    primaryButton: {
        backgroundColor: '#FFC107',
        borderColor: '#FFC107',
        ...Platform.select({
            web: { boxShadow: '0px 8px 20px rgba(255, 193, 7, 0.3)' }
        })
    },
    secondaryButton: {
        backgroundColor: '#252243',
        borderColor: '#8B5CF6',
        ...Platform.select({
            web: { boxShadow: '0px 8px 20px rgba(139, 92, 246, 0.2)' }
        })
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderColor: '#3B3663',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    buttonSubText: {
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '600',
    }
});

