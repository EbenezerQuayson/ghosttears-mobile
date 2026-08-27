import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import MultiplayerEngine from '../engine/MultiplayerEngine';

export default function LobbyScreen({ navigation, route }) {
    const { mode, gameSettings } = route.params; // 'host' or 'join'
    const [roomCode, setRoomCode] = useState('');
    const [engine, setEngine] = useState(null);

    // Future state from MultiplayerEngine
    // const [isWaiting, setIsWaiting] = useState(mode === 'host');

    useEffect(() => {
        let activeEngine = null;

        const setupHost = async () => {
            const room = await MultiplayerEngine.createRoom(gameSettings);
            if (room) {
                setRoomCode(room.room_code);
                activeEngine = new MultiplayerEngine(room.room_code, 'host', (newRoomState) => {
                    if (newRoomState.status === 'playing') {
                        // Navigate to Game
                        navigation.replace('Game', {
                            mode: 'multiplayer',
                            roomCode: room.room_code,
                            playerId: 'host',
                            gameSettings: gameSettings
                        });
                    }
                });
                activeEngine.subscribe();
                setEngine(activeEngine);
            } else {
                Alert.alert("Error", "Could not connect to Supabase backend API. Check your .env setup.");
            }
        };

        if (mode === 'host') {
            setupHost();
        }

        return () => {
            if (activeEngine) activeEngine.unsubscribe();
        }
    }, [mode]);

    const handleJoin = async () => {
        if (roomCode.length !== 4) return;
        const joinedRoom = await MultiplayerEngine.joinRoom(roomCode);
        if (joinedRoom) {
            navigation.replace('Game', {
                mode: 'multiplayer',
                roomCode: roomCode,
                playerId: 'guest',
                gameSettings: joinedRoom.game_settings
            });
        } else {
            Alert.alert("Error", "Room not found or game already started.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.title}>{mode === 'host' ? 'HOST GAME' : 'JOIN GAME'}</Text>

            {mode === 'host' ? (
                <View style={styles.content}>
                    <Text style={styles.label}>Room Code:</Text>
                    <Text style={styles.code}>{roomCode}</Text>
                    <ActivityIndicator size="large" color="#ff3333" style={{ marginTop: 20 }} />
                    <Text style={styles.waitingText}>Waiting for opponent to join...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={styles.label}>Enter Room Code:</Text>
                    <TextInput
                        style={styles.input}
                        autoCapitalize="characters"
                        maxLength={4}
                        value={roomCode}
                        onChangeText={setRoomCode}
                        placeholder="XXXX"
                        placeholderTextColor="#333333"
                    />
                    <TouchableOpacity
                        style={[styles.joinButton, roomCode.length !== 4 && styles.joinButtonDisabled]}
                        disabled={roomCode.length !== 4}
                        onPress={handleJoin}
                    >
                        <Text style={[styles.joinText, roomCode.length !== 4 && styles.joinTextDisabled]}>JOIN</Text>
                    </TouchableOpacity>
                </View>
            )}

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 50,
        textAlign: 'center',
    },
    content: {
        alignItems: 'center',
        marginBottom: 40,
        width: '100%',
    },
    label: {
        color: '#a1a1aa',
        fontSize: 18,
        letterSpacing: 2,
        marginBottom: 15,
        fontWeight: '900',
    },
    code: {
        color: '#FFC107',
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: 10,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#252243',
        color: '#ffffff',
        fontSize: 42,
        fontWeight: '900',
        textAlign: 'center',
        width: 250,
        height: 80,
        borderWidth: 2,
        borderColor: '#3B3663',
        borderRadius: 20,
        letterSpacing: 10,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    joinButton: {
        backgroundColor: '#FFC107',
        paddingVertical: 18,
        paddingHorizontal: 60,
        borderRadius: 20,
        shadowColor: '#FFC107',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    joinButtonDisabled: {
        backgroundColor: '#252243',
        borderColor: '#3B3663',
        borderWidth: 2,
        shadowOpacity: 0,
        elevation: 0,
    },
    joinText: {
        color: '#18152E',
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 18,
    },
    joinTextDisabled: {
        color: '#666666',
    },
    waitingText: {
        color: '#8B5CF6',
        marginTop: 20,
        fontWeight: '600',
        letterSpacing: 1,
    },
    cancelButton: {
        marginTop: 30,
        borderWidth: 2,
        borderColor: '#3B3663',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 20,
    },
    cancelText: {
        color: '#a1a1aa',
        fontWeight: '900',
        letterSpacing: 1,
    }
});
