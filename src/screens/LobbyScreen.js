import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, TextInput, Alert, ScrollView } from 'react-native';
import MultiplayerEngine from '../engine/MultiplayerEngine';

const generateRandomId = () => Math.random().toString(36).substring(2, 9);

export default function LobbyScreen({ navigation, route }) {
    const { mode, gameSettings } = route.params; // 'host' or 'join'
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');
    const [playerId] = useState(generateRandomId());
    
    // Engine State
    const [engine, setEngine] = useState(null);
    const [roomState, setRoomState] = useState(null); // The raw row from supabase
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
        if (roomState && roomState.status === 'playing') {
            navigation.replace('Game', {
                mode: 'multiplayer',
                roomCode: roomState.room_code,
                playerId: playerId,
                gameSettings: roomState.game_settings,
                initialPlayers: roomState.players
            });
        }
    }, [roomState, navigation, playerId]);

    // Cleanup subscription on unmount
    useEffect(() => {
        return () => {
            if (engine) engine.unsubscribe();
        }
    }, [engine]);

    const handleCreateRoom = async () => {
        if (username.trim().length < 2) {
            Alert.alert("Invalid Name", "Username must be at least 2 characters.");
            return;
        }

        setIsCreating(true);
        const room = await MultiplayerEngine.createRoom(gameSettings, username.trim(), playerId);
        if (room) {
            setRoomCode(room.room_code);
            setRoomState(room);
            setHasJoined(true);

            const activeEngine = new MultiplayerEngine(room.room_code, playerId, (newRoomState) => {
                setRoomState(newRoomState);
            });
            activeEngine.subscribe();
            setEngine(activeEngine);
        } else {
            Alert.alert("Error", "Could not create room.");
        }
        setIsCreating(false);
    };

    const handleJoinRoom = async () => {
        if (roomCode.length !== 4) return;
        if (username.trim().length < 2) {
            Alert.alert("Invalid Name", "Username must be at least 2 characters.");
            return;
        }

        setIsJoining(true);
        const joinedRoom = await MultiplayerEngine.joinRoom(roomCode, username.trim(), playerId);
        if (joinedRoom) {
            setRoomState(joinedRoom);
            setHasJoined(true);

            const activeEngine = new MultiplayerEngine(roomCode.toUpperCase(), playerId, (newRoomState) => {
                setRoomState(newRoomState);
            });
            activeEngine.subscribe();
            setEngine(activeEngine);
        } else {
            Alert.alert("Error", "Room not found or game already started.");
        }
        setIsJoining(false);
    };

    const handleStartMatch = async () => {
        if (engine && roomState.players.length > 1) {
            await engine.startGame(playerId); // Host always starts first turn for simplicity
        }
    };

    // UI Renders
    if (mode === 'host' && hasJoined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flex: 1, padding: 20 }}>
                    <Text style={styles.title}>LOBBY</Text>
                    
                    <View style={styles.content}>
                        <Text style={styles.label}>Room Code:</Text>
                        <Text style={styles.code}>{roomCode}</Text>
                    </View>

                    <Text style={[styles.label, { marginBottom: 10 }]}>Players Joined:</Text>
                    <ScrollView style={{ flex: 1, width: '100%', marginBottom: 20 }}>
                        {roomState?.players?.map((p, index) => (
                            <View key={p.id} style={styles.playerCard}>
                                <Text style={styles.playerName}>{index + 1}. {p.name} {p.id === playerId ? '(YOU)' : ''}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {roomState?.players?.length < 2 ? (
                        <Text style={styles.waitingText}>Waiting for others to join...</Text>
                    ) : (
                        <TouchableOpacity style={styles.joinButton} onPress={handleStartMatch}>
                            <Text style={styles.joinText}>START MATCH</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (mode === 'join' && hasJoined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.title}>JOINED ROOM</Text>
                    <Text style={styles.code}>{roomCode}</Text>
                    
                    <Text style={[styles.label, { marginTop: 20, marginBottom: 10 }]}>Players in Room:</Text>
                    {roomState?.players?.map((p, index) => (
                        <Text key={p.id} style={{ color: p.id === playerId ? '#FFC107' : '#fff', fontSize: 18, marginBottom: 5 }}>
                            {p.name} {p.id === playerId ? '(YOU)' : ''}
                        </Text>
                    ))}

                    <ActivityIndicator size="large" color="#2DD4BF" style={{ marginTop: 40 }} />
                    <Text style={styles.waitingText}>Waiting for Host to start match...</Text>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>LEAVE LOBBY</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Initial Form UI
    return (
        <SafeAreaView style={styles.container}>
            <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.title}>{mode === 'host' ? 'HOST GAME' : 'JOIN GAME'}</Text>

                <View style={styles.content}>
                    <Text style={styles.label}>Enter Username:</Text>
                    <TextInput
                        style={[styles.input, { letterSpacing: 2, height: 60 }]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Your Name"
                        placeholderTextColor="#555"
                        maxLength={12}
                    />

                    {mode === 'join' && (
                        <>
                            <Text style={[styles.label, { marginTop: 20 }]}>Enter Room Code:</Text>
                            <TextInput
                                style={styles.input}
                                autoCapitalize="characters"
                                maxLength={4}
                                value={roomCode}
                                onChangeText={setRoomCode}
                                placeholder="XXXX"
                                placeholderTextColor="#333333"
                            />
                        </>
                    )}

                    {mode === 'host' ? (
                        <TouchableOpacity
                            style={[styles.joinButton, (username.trim().length < 2 || isCreating) && styles.joinButtonDisabled]}
                            disabled={username.trim().length < 2 || isCreating}
                            onPress={handleCreateRoom}
                        >
                            <Text style={styles.joinText}>{isCreating ? 'CREATING...' : 'CREATE ROOM'}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.joinButton, (roomCode.length !== 4 || username.trim().length < 2 || isJoining) && styles.joinButtonDisabled]}
                            disabled={roomCode.length !== 4 || username.trim().length < 2 || isJoining}
                            onPress={handleJoinRoom}
                        >
                            <Text style={styles.joinText}>{isJoining ? 'JOINING...' : 'JOIN ROOM'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
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
        width: 300,
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
        width: '100%',
        alignItems: 'center',
        marginTop: 20,
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
    waitingText: {
        color: '#8B5CF6',
        marginTop: 20,
        fontWeight: '600',
        letterSpacing: 1,
        textAlign: 'center'
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
    },
    playerCard: {
        backgroundColor: '#252243',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#2DD4BF'
    },
    playerName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1
    }
});
