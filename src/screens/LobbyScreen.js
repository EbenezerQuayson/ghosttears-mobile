import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, TextInput, Alert, ScrollView, Platform } from 'react-native';
import MultiplayerEngine from '../engine/MultiplayerEngine';

const generateRandomId = () => Math.random().toString(36).substring(2, 9);

export default function LobbyScreen({ navigation, route }) {
    const { mode, gameSettings } = route.params; // 'host' or 'join'
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');
    const [playerId] = useState(generateRandomId());
    
    // Engine State
    const [engine, setEngine] = useState(null);
    const [roomState, setRoomState] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
        if (roomState && roomState.status === 'playing') {
            if (Platform.OS === 'web' && typeof document !== 'undefined') {
                document.activeElement?.blur?.();
            }
            navigation.replace('Game', {
                mode: 'multiplayer',
                roomCode: roomState.room_code,
                playerId: playerId,
                gameSettings: roomState.game_settings,
                initialPlayers: roomState.players
            });
        }
    }, [roomState, navigation, playerId]);

    useEffect(() => {
        return () => {
            if (engine) engine.unsubscribe();
        };
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
            await engine.startGame(playerId);
        }
    };

    // Host View inside lobby
    if (mode === 'host' && hasJoined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.wrapper}>
                    
                    {/* Header Banner */}
                    <View style={styles.bannerContainer}>
                        <View style={styles.bannerWingLeftTeal} />
                        <View style={styles.bannerMainTeal}>
                            <Text style={styles.bannerText}>MATCH LOBBY</Text>
                        </View>
                        <View style={styles.bannerWingRightTeal} />
                    </View>

                    <View style={styles.card}>
                        {/* 3D Room Code Plaque */}
                        <View style={styles.codePlaque}>
                            <Text style={styles.codeLabel}>ROOM CODE</Text>
                            <Text style={styles.codeValue}>{roomCode}</Text>
                        </View>

                        {/* Player List */}
                        <View style={styles.playerSection}>
                            <Text style={styles.sectionTitle}>
                                PLAYERS JOINED ({roomState?.players?.length || 0})
                            </Text>
                            <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
                                {roomState?.players?.map((p, index) => (
                                    <View key={p.id} style={styles.playerItem}>
                                        <View style={styles.playerBadge}>
                                            <Text style={styles.playerBadgeText}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.playerName}>{p.name}</Text>
                                        {p.id === playerId && (
                                            <View style={styles.hostTag}>
                                                <Text style={styles.hostTagText}>HOST</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {roomState?.players?.length < 2 ? (
                            <View style={styles.waitingBox}>
                                <ActivityIndicator size="small" color="#00A8B5" />
                                <Text style={styles.waitingText}>Waiting for players to enter code...</Text>
                            </View>
                        ) : (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.btn3D,
                                    styles.greenBtn,
                                    pressed && styles.btn3DPressed
                                ]}
                                onPress={handleStartMatch}
                            >
                                <Text style={styles.btnText}>START MATCH</Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={({ pressed }) => [
                                styles.btn3D,
                                styles.neutralBtn,
                                { marginTop: 10 },
                                pressed && styles.btn3DPressed
                            ]}
                            onPress={() => {
                                if (Platform.OS === 'web' && typeof document !== 'undefined') document.activeElement?.blur?.();
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.neutralBtnText}>CANCEL LOBBY</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Guest View after joining
    if (mode === 'join' && hasJoined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.wrapper}>
                    
                    {/* Header Banner */}
                    <View style={styles.bannerContainer}>
                        <View style={styles.bannerWingLeftOrange} />
                        <View style={styles.bannerMainOrange}>
                            <Text style={styles.bannerText}>ROOM JOINED</Text>
                        </View>
                        <View style={styles.bannerWingRightOrange} />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.codePlaque}>
                            <Text style={styles.codeLabel}>ROOM CODE</Text>
                            <Text style={styles.codeValue}>{roomCode}</Text>
                        </View>

                        <View style={styles.playerSection}>
                            <Text style={styles.sectionTitle}>PLAYERS IN ROOM</Text>
                            <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
                                {roomState?.players?.map((p, index) => (
                                    <View key={p.id} style={styles.playerItem}>
                                        <View style={styles.playerBadge}>
                                            <Text style={styles.playerBadgeText}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.playerName}>{p.name}</Text>
                                        {p.id === playerId && (
                                            <View style={styles.hostTag}>
                                                <Text style={styles.hostTagText}>YOU</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.waitingBox}>
                            <ActivityIndicator size="small" color="#FFA114" />
                            <Text style={styles.waitingText}>Waiting for Host to start match...</Text>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.btn3D,
                                styles.neutralBtn,
                                pressed && styles.btn3DPressed
                            ]}
                            onPress={() => {
                                if (Platform.OS === 'web' && typeof document !== 'undefined') document.activeElement?.blur?.();
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.neutralBtnText}>LEAVE ROOM</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Initial Join / Host Form
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.wrapper}>
                
                {/* Header Banner */}
                <View style={styles.bannerContainer}>
                    <View style={mode === 'host' ? styles.bannerWingLeftTeal : styles.bannerWingLeftOrange} />
                    <View style={mode === 'host' ? styles.bannerMainTeal : styles.bannerMainOrange}>
                        <Text style={styles.bannerText}>{mode === 'host' ? 'HOST GAME' : 'JOIN ROOM'}</Text>
                    </View>
                    <View style={mode === 'host' ? styles.bannerWingRightTeal : styles.bannerWingRightOrange} />
                </View>

                <View style={styles.card}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>YOUR DISPLAY NAME</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Player Name"
                                placeholderTextColor="#A89E8D"
                                maxLength={12}
                                autoFocus={Platform.OS !== 'web' && mode === 'host'}
                            />
                        </View>

                        {mode === 'join' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>4-LETTER ROOM CODE</Text>
                                <TextInput
                                    style={[styles.input, styles.codeInput]}
                                    autoCapitalize="characters"
                                    maxLength={4}
                                    value={roomCode}
                                    onChangeText={(text) => setRoomCode(text.toUpperCase())}
                                    placeholder="XXXX"
                                    placeholderTextColor="#C4BDB0"
                                    autoFocus={Platform.OS !== 'web'}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        {mode === 'host' ? (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.btn3D,
                                    (username.trim().length < 2 || isCreating) ? styles.btnDisabled : styles.greenBtn,
                                    pressed && !(username.trim().length < 2 || isCreating) && styles.btn3DPressed
                                ]}
                                disabled={username.trim().length < 2 || isCreating}
                                onPress={handleCreateRoom}
                            >
                                <Text style={styles.btnText}>
                                    {isCreating ? 'CREATING...' : 'CREATE ROOM'}
                                </Text>
                            </Pressable>
                        ) : (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.btn3D,
                                    (roomCode.length !== 4 || username.trim().length < 2 || isJoining) ? styles.btnDisabled : styles.orangeBtn,
                                    pressed && !(roomCode.length !== 4 || username.trim().length < 2 || isJoining) && styles.btn3DPressed
                                ]}
                                disabled={roomCode.length !== 4 || username.trim().length < 2 || isJoining}
                                onPress={handleJoinRoom}
                            >
                                <Text style={styles.btnText}>
                                    {isJoining ? 'JOINING...' : 'JOIN ROOM'}
                                </Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={({ pressed }) => [
                                styles.btn3D,
                                styles.neutralBtn,
                                pressed && styles.btn3DPressed
                            ]}
                            onPress={() => {
                                if (Platform.OS === 'web' && typeof document !== 'undefined') document.activeElement?.blur?.();
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.neutralBtnText}>BACK TO MENU</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F3E7',
    },
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    bannerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    bannerWingLeftTeal: {
        width: 16,
        height: 34,
        backgroundColor: '#007A84',
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
        marginRight: -4,
        transform: [{ translateY: 3 }],
    },
    bannerWingRightTeal: {
        width: 16,
        height: 34,
        backgroundColor: '#007A84',
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
        marginLeft: -4,
        transform: [{ translateY: 3 }],
    },
    bannerMainTeal: {
        backgroundColor: '#00A8B5',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 14,
        borderBottomWidth: 4,
        borderBottomColor: '#007A84',
        zIndex: 10,
    },
    bannerWingLeftOrange: {
        width: 16,
        height: 34,
        backgroundColor: '#D77500',
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
        marginRight: -4,
        transform: [{ translateY: 3 }],
    },
    bannerWingRightOrange: {
        width: 16,
        height: 34,
        backgroundColor: '#D77500',
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
        marginLeft: -4,
        transform: [{ translateY: 3 }],
    },
    bannerMainOrange: {
        backgroundColor: '#FFA114',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 14,
        borderBottomWidth: 4,
        borderBottomColor: '#D77500',
        zIndex: 10,
    },
    bannerText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1.5,
        textAlign: 'center',
        ...Platform.select({
            web: { textShadow: '0px 1.5px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 1,
            }
        }),
    },
    card: {
        maxWidth: 440,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#E8E1CF',
        borderBottomWidth: 6,
        borderBottomColor: '#D4CBB4',
        padding: 20,
    },
    codePlaque: {
        backgroundColor: '#FFF8EA',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#F0E2C8',
        borderBottomWidth: 5,
        borderBottomColor: '#E2D0B0',
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 16,
    },
    codeLabel: {
        color: '#A68F6B',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    codeValue: {
        color: '#FFA114',
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: 8,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    playerSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#8C7E6A',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
    },
    playerList: {
        maxHeight: 180,
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5EFE3',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderBottomWidth: 3,
        borderBottomColor: '#E5DDCF',
        marginBottom: 6,
        gap: 10,
    },
    playerBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#00A8B5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    playerName: {
        color: '#4A3E3D',
        fontSize: 15,
        fontWeight: '800',
        flex: 1,
    },
    hostTag: {
        backgroundColor: '#6DC328',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    hostTagText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    waitingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAF7EE',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EDE5D4',
        gap: 8,
        marginBottom: 14,
    },
    waitingText: {
        color: '#8C7E6A',
        fontSize: 13,
        fontWeight: '700',
    },
    form: {
        gap: 14,
        marginBottom: 16,
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        color: '#8C7E6A',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#FAF7EE',
        color: '#3B332B',
        fontSize: 16,
        fontWeight: '700',
        height: 50,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#E8E1CF',
        borderBottomWidth: 4,
        borderBottomColor: '#D8D0BC',
        paddingHorizontal: 16,
    },
    codeInput: {
        fontSize: 26,
        letterSpacing: 8,
        textAlign: 'center',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    actions: {
        gap: 10,
    },
    btn3D: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' }
        })
    },
    btn3DPressed: {
        transform: [{ translateY: 3 }],
        borderBottomWidth: 2,
    },
    greenBtn: {
        backgroundColor: '#6DC328',
        borderBottomWidth: 5,
        borderBottomColor: '#4A8D15',
    },
    orangeBtn: {
        backgroundColor: '#FFA114',
        borderBottomWidth: 5,
        borderBottomColor: '#D77500',
    },
    neutralBtn: {
        backgroundColor: '#EAE4D3',
        borderBottomWidth: 4,
        borderBottomColor: '#CFC7B4',
    },
    btnDisabled: {
        backgroundColor: '#E5DFCE',
        borderBottomWidth: 4,
        borderBottomColor: '#D0C9B6',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: 1,
        ...Platform.select({
            web: { textShadow: '0px 1.5px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 1,
            }
        }),
    },
    neutralBtnText: {
        color: '#7C6F5A',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    }
});
