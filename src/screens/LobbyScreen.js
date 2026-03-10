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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginBottom: 40,
    },
    content: {
        alignItems: 'center',
        marginBottom: 40,
    },
    label: {
        color: '#888888',
        fontSize: 16,
        letterSpacing: 2,
        marginBottom: 10,
    },
    code: {
        color: '#ff3333',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 10,
    },
    input: {
        backgroundColor: '#1f1f1f',
        color: '#ffffff',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 200,
        height: 60,
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 4,
        letterSpacing: 10,
        marginBottom: 20,
    },
    joinButton: {
        backgroundColor: '#ff3333',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 4,
    },
    joinButtonDisabled: {
        backgroundColor: '#1a0000',
        borderColor: '#330000',
        borderWidth: 1,
    },
    joinText: {
        color: '#ffffff',
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    joinTextDisabled: {
        color: '#555555',
    },
    waitingText: {
        color: '#888888',
        marginTop: 20,
    },
    cancelButton: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#333333',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 4,
    },
    cancelText: {
        color: '#aaaaaa',
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
