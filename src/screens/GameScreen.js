import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import Keyboard from '../components/Keyboard';
import CategoryBoard from '../components/CategoryBoard';
import ActivePlayArea from '../components/ActivePlayArea';
import Scoreboard from '../components/Scoreboard';
import gameDictionary, { initializeDictionary } from '../engine/WordEngine';
import MultiplayerEngine from '../engine/MultiplayerEngine';

export default function GameScreen({ route, navigation }) {
    const { mode, roomCode, playerId, gameSettings } = route?.params || { mode: 'single' };
    const isMultiplayer = mode === 'multiplayer';

    // Fallback settings if not provided
    const settings = gameSettings || { turnTimer: 30, categories: ['animals', 'countries', 'fruits', 'vegetables'] };

    const [isInitializing, setIsInitializing] = useState(true);
    const [engine, setEngine] = useState(null);

    // Core Game State
    const [selectedCategories] = useState(settings.categories);
    const [activeCategory, setActiveCategory] = useState(null);
    const [lockedWords, setLockedWords] = useState({ animals: [], countries: [], fruits: [], vegetables: [] });
    const [currentFragment, setCurrentFragment] = useState('');
    const [pendingLetter, setPendingLetter] = useState(null);

    // Meta Game State
    const [playerTurn, setPlayerTurn] = useState(isMultiplayer ? 'host' : 'player');
    const [playerLives, setPlayerLives] = useState({ player: 0, bot: 0 }); // Maps to 'player'/'bot' locally
    const [gameState, setGameState] = useState('playing'); // 'playing', 'challenged', 'game_over'
    const [turnTimer, setTurnTimer] = useState(settings.turnTimer);
    const [turnEndsAt, setTurnEndsAt] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [latestEvent, setLatestEvent] = useState(null);

    // Profile State
    const [playerNames, setPlayerNames] = useState({ hostName: 'Player 1', guestName: 'Player 2' });

    // Init Dictionary
    useEffect(() => {
        setTimeout(() => {
            initializeDictionary();
            setIsInitializing(false);
        }, 100);
    }, []);

    // Timer Hook
    useEffect(() => {
        let animationFrameId;

        const updateTimer = () => {
            if (gameState === 'playing' && activeCategory && turnEndsAt && !isPaused) {
                const remainingRaw = turnEndsAt - Date.now();
                const remainingSecs = Math.max(0, Math.ceil(remainingRaw / 1000));

                setTurnTimer(remainingSecs);

                if (remainingRaw <= 0) {
                    handleTimeout();
                } else {
                    animationFrameId = requestAnimationFrame(updateTimer);
                }
            }
        };

        if (gameState === 'playing' && activeCategory && turnEndsAt && !isPaused) {
            animationFrameId = requestAnimationFrame(updateTimer);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [gameState, activeCategory, turnEndsAt, isPaused, playerTurn, currentFragment]);

    // Engine Init
    useEffect(() => {
        if (isMultiplayer && roomCode && playerId && !isInitializing) {
            const multiEngine = new MultiplayerEngine(roomCode, playerId, (newRoom) => {
                const yourPenalty = playerId === 'host' ? newRoom.host_penalty : newRoom.guest_penalty;
                const oppPenalty = playerId === 'host' ? newRoom.guest_penalty : newRoom.host_penalty;

                setPlayerLives({ player: yourPenalty, bot: oppPenalty });
                setCurrentFragment(newRoom.current_fragment);
                setPlayerTurn(newRoom.player_turn);
                setActiveCategory(newRoom.active_category);

                if (newRoom.locked_words) {
                    setLockedWords(newRoom.locked_words);
                }

                if (newRoom.turn_ends_at !== undefined) {
                    setTurnEndsAt(newRoom.turn_ends_at);
                }
                if (newRoom.is_paused !== undefined) {
                    setIsPaused(newRoom.is_paused);
                }
                if (newRoom.latest_event) {
                    setLatestEvent(newRoom.latest_event);
                }

                if (newRoom.status === 'finished') {
                    setGameState('game_over');
                } else if (!newRoom.active_category && newRoom.current_fragment === '') {
                    // Reset local states for new round
                    setPendingLetter(null);
                    setTurnEndsAt(null);
                    setTurnTimer(settings.turnTimer);
                    setGameState('playing');
                } else {
                    setGameState('playing');
                    // Reset timer on turn pass IF it just changed from us to them or them to us
                    // For now, simpler to just reset pending letter
                    setPendingLetter(null);
                    // Timer resets handled locally via turnTimer 30 resets in processMove
                }

                // Try to fetch names if we don't have them yet and both players are present
                if (newRoom.host_id && newRoom.guest_id && newRoom.guest_id !== 'guest_anon') {
                    multiEngine.getPlayerNames(newRoom.host_id, newRoom.guest_id).then(names => setPlayerNames(names));
                }
            });
            multiEngine.subscribe();
            setEngine(multiEngine);

            return () => multiEngine.unsubscribe();
        }
    }, [isMultiplayer, roomCode, playerId, isInitializing]);

    // Toast Event Subscriptions
    useEffect(() => {
        if (latestEvent) {
            Toast.show({
                type: latestEvent.type || 'info',
                text1: latestEvent.title,
                text2: latestEvent.message,
                position: 'top',
                visibilityTime: 3000,
            });
        }
    }, [latestEvent?.timestamp]);

    const handleTimeout = () => {
        // Prevent double execution
        setTurnEndsAt(null);

        // Only run timeout logic if it's currently single player, or if it's our turn in multi
        if (!isMultiplayer && playerTurn === 'player') {
            processTimeoutSingle('player', activeCategory);
        } else if (!isMultiplayer && playerTurn === 'bot') {
            processTimeoutSingle('bot', activeCategory);
        } else if (isMultiplayer && playerTurn === playerId) {
            processTimeoutMulti(activeCategory);
        }
    };

    const processTimeoutSingle = (loser, category) => {
        Toast.show({ type: 'error', text1: 'Time is up!', text2: `${loser === 'player' ? 'YOU take' : 'AI takes'} a penalty.` });
        resetRoundSingle(loser, currentFragment);
    };

    // Local Bot Hook
    useEffect(() => {
        if (!isMultiplayer && gameState === 'playing' && playerTurn === 'bot') {
            // Give bot 1 to 2 seconds to "think"
            const botDelay = Math.floor(Math.random() * 1000) + 1000;
            const botTimer = setTimeout(() => {
                let targetCategory = activeCategory;
                if (!targetCategory) {
                    targetCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
                    setActiveCategory(targetCategory);
                }

                const nextLetter = gameDictionary.getNoviceMove(targetCategory, currentFragment, lockedWords[targetCategory]);
                if (!nextLetter) {
                    const fallback = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
                    processMoveSingle(currentFragment + fallback, 'bot', targetCategory);
                } else {
                    processMoveSingle(currentFragment + nextLetter, 'bot', targetCategory);
                }
            }, botDelay);
            return () => clearTimeout(botTimer);
        }
    }, [playerTurn, gameState, currentFragment, activeCategory, isMultiplayer]);

    // ==========================================
    // SINGLE PLAYER LOGIC (With Categories)
    // ==========================================
    const processMoveSingle = (newFragment, currentPlayer, category) => {
        setCurrentFragment(newFragment);
        setPendingLetter(null);
        setTurnEndsAt(Date.now() + settings.turnTimer * 1000);

        const status = gameDictionary.checkStatus(category, newFragment, lockedWords[category]);

        const resetRoundSingle = (loser, wordToLock) => {
            const newLives = { ...playerLives, [loser]: playerLives[loser] + 1 };
            setPlayerLives(newLives);

            if (wordToLock) {
                setLockedWords(prev => ({
                    ...prev,
                    [category]: [...prev[category], wordToLock]
                }));
            }

            if (newLives.player >= 10 || newLives.bot >= 10) {
                setGameState('game_over');
            } else {
                setTimeout(() => {
                    setCurrentFragment('');
                    setPendingLetter(null);
                    setActiveCategory(null);
                    setTurnEndsAt(null);
                    setPlayerTurn('player');
                    setGameState('playing');
                }, 2000);
            }
        };

        if (status === 'COMPLETE_WORD') {
            setGameState('challenged');
            Toast.show({ type: 'error', text1: 'Word Completed!', text2: `"${newFragment}" is a valid ${category}. ${currentPlayer === 'player' ? 'You take' : 'AI takes'} a penalty.` });
            resetRoundSingle(currentPlayer, newFragment);
        } else if (status === 'INVALID') {
            setGameState('challenged');
            Toast.show({ type: 'error', text1: 'Bluff Caught!', text2: `"${newFragment}" is not a valid prefix for ${category}. ${currentPlayer === 'player' ? 'You take' : 'AI takes'} a penalty.` });
            resetRoundSingle(currentPlayer, newFragment);
        } else {
            setPlayerTurn(currentPlayer === 'player' ? 'bot' : 'player');
        }
    };

    // ==========================================
    // MULTIPLAYER LOGIC
    // ==========================================
    const processTimeoutMulti = async (category) => {
        const nextTurn = playerId === 'host' ? 'guest' : 'host';
        const hostPenalty = playerId === 'host' ? playerLives.player + 1 : playerLives.bot;
        const guestPenalty = playerId === 'guest' ? playerLives.player + 1 : playerLives.bot;

        const title = 'Time is up!';
        const message = `${players.find(p => p.id === playerId).label} takes a penalty.`;
        await engine.sendEvent(title, message, 'error');

        const newLockedWords = {
            ...lockedWords,
            [category]: [...lockedWords[category], currentFragment]
        };

        if (currentFragment) {
            await engine.sendPenalty(hostPenalty, guestPenalty, nextTurn, newLockedWords);
        } else {
            await engine.sendPenalty(hostPenalty, guestPenalty, nextTurn, lockedWords);
        }
    };

    const processMoveMulti = async (newFragment, category) => {
        setPendingLetter(null);

        const status = gameDictionary.checkStatus(category, newFragment, lockedWords[category]);
        const nextTurn = playerId === 'host' ? 'guest' : 'host';

        if (status === 'COMPLETE_WORD' || status === 'INVALID') {
            const isInvalid = status === 'INVALID';
            const title = isInvalid ? 'Bluff Caught!' : 'Word Completed!';
            const message = `"${newFragment}" is ${isInvalid ? 'not a valid prefix for' : 'a valid'} ${category}. ${players.find(p => p.id === playerId).label} takes a penalty.`;

            await engine.sendEvent(title, message, 'error');

            const hostPenalty = playerId === 'host' ? playerLives.player + 1 : playerLives.bot;
            const guestPenalty = playerId === 'guest' ? playerLives.player + 1 : playerLives.bot;

            // Generate the new locked words payload to send
            const newLockedWords = {
                ...lockedWords,
                [category]: [...lockedWords[category], newFragment]
            };

            await engine.sendPenalty(hostPenalty, guestPenalty, nextTurn, newLockedWords);
        } else {
            await engine.sendMove(newFragment, category, nextTurn, settings.turnTimer);
        }
    };

    // ==========================================
    // UI HANDLERS
    // ==========================================
    const handleCategorySelect = async (category) => {
        if (!isMultiplayer && playerTurn === 'player') {
            setActiveCategory(category);
            setPendingLetter(null);
            setTurnEndsAt(Date.now() + settings.turnTimer * 1000);
        } else if (isMultiplayer && playerTurn === playerId) {
            setActiveCategory(category);
            setPendingLetter(null);
            await engine.sendCategorySelect(category, settings.turnTimer);
        }
    };

    const handlePlayerKeyPress = (key) => {
        if (gameState !== 'playing') return;
        if (!activeCategory) {
            Toast.show({ type: 'info', text1: "Select a category", text2: "Tap a category column first to start the round." });
            return;
        }

        if (!isMultiplayer && playerTurn !== 'player') return;

        // Instead of processing immediately, we set the pending letter
        setPendingLetter(key);
    };

    const handleLockIn = async () => {
        if (!isMultiplayer) {
            processMoveSingle(currentFragment + pendingLetter, 'player', activeCategory);
        } else {
            await processMoveMulti(currentFragment + pendingLetter, activeCategory);
        }
    };

    const togglePause = async () => {
        if (isMultiplayer) {
            const newPauseState = !isPaused;
            if (newPauseState) {
                // We are pausing. Don't set turnEndsAt based on timeRemaining yet, just pause.
                await engine.sendPauseToggle(true, null);
                await engine.sendEvent('Game Paused', `${players.find(p => p.id === playerId).label} paused the game.`, 'info');
            } else {
                // Resuming.
                await engine.sendPauseToggle(false, turnTimer * 1000);
                await engine.sendEvent('Game Resumed', `${players.find(p => p.id === playerId).label} resumed the game.`, 'info');
            }
        } else {
            setIsPaused(!isPaused);
            if (isPaused && turnEndsAt) {
                // We were paused, calculating resume
                setTurnEndsAt(Date.now() + turnTimer * 1000);
            }
        }
    };

    const isMyTurn = isMultiplayer ? playerTurn === playerId : playerTurn === 'player';

    if (isInitializing) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>LOADING DICTIONARIES...</Text>
            </View>
        );
    }

    const players = isMultiplayer
        ? [
            { id: 'host', label: playerId === 'host' ? `${playerNames.hostName} (YOU)` : playerNames.hostName, score: playerId === 'host' ? playerLives.player : playerLives.bot },
            { id: 'guest', label: playerId === 'guest' ? `${playerNames.guestName} (YOU)` : playerNames.guestName, score: playerId === 'guest' ? playerLives.player : playerLives.bot },
        ]
        : [
            { id: 'player', label: 'YOU', score: playerLives.player },
            { id: 'bot', label: 'AI', score: playerLives.bot },
        ];

    return (
        <SafeAreaView style={styles.container}>
            <Scoreboard players={players} />

            <Modal visible={showPauseModal || isPaused} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>GAME PAUSED</Text>

                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => {
                                setShowPauseModal(false);
                                togglePause();
                            }}
                        >
                            <Text style={styles.modalBtnText}>RESUME</Text>
                        </TouchableOpacity>

                        {(!isMultiplayer || playerId === 'host') && (
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.dangerBtn]}
                                onPress={() => {
                                    // Hacky restart
                                    if (!isMultiplayer) {
                                        setGameState('playing');
                                        setPlayerLives({ player: 0, bot: 0 });
                                        setLockedWords({ animals: [], countries: [], fruits: [], vegetables: [] });
                                        setCurrentFragment('');
                                        setActiveCategory(null);
                                        setPlayerTurn('player');
                                        setShowPauseModal(false);
                                        togglePause();
                                    } else {
                                        // Not fully implemented for robust multiplayer restart yet
                                        Toast.show({ type: 'info', text1: 'Restart functionality WIP.' });
                                    }
                                }}
                            >
                                <Text style={styles.modalBtnText}>RESTART ROOM</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={() => {
                                setShowPauseModal(false);
                                navigation.navigate('Home');
                            }}
                        >
                            <Text style={styles.modalBtnText}>QUIT TO MENU</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {isMultiplayer && (
                <View style={styles.roomHeader}>
                    <Text style={styles.roomText}>ROOM: {roomCode}</Text>
                    <TouchableOpacity
                        style={styles.pauseIconContainer}
                        onPress={() => {
                            setShowPauseModal(true);
                            if (!isPaused) togglePause();
                        }}
                    >
                        <Text style={styles.pauseIconText}>||</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isMultiplayer && (
                <View style={styles.roomHeader}>
                    <Text style={styles.roomText}>SINGLE PLAYER</Text>
                    <TouchableOpacity
                        style={styles.pauseIconContainer}
                        onPress={() => {
                            setShowPauseModal(true);
                            if (!isPaused) togglePause();
                        }}
                    >
                        <Text style={styles.pauseIconText}>||</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.turnContainer}>
                <Text style={styles.turnIndicator}>
                    {gameState === 'game_over'
                        ? 'GAME OVER'
                        : (isMyTurn ? (!activeCategory ? 'PICK A CATEGORY' : 'YOUR TURN') : 'OPPONENT TURN')}
                </Text>
                {activeCategory && gameState === 'playing' && (
                    <Text style={[styles.timerText, turnTimer <= 10 && styles.timerDanger]}>
                        00:{turnTimer.toString().padStart(2, '0')}
                    </Text>
                )}
            </View>

            <CategoryBoard
                categories={selectedCategories}
                activeCategory={activeCategory}
                lockedWords={lockedWords}
                gameState={gameState}
                onSelectCategory={handleCategorySelect}
                isMyTurn={isMyTurn}
            />

            <ActivePlayArea
                currentFragment={currentFragment}
                pendingLetter={pendingLetter}
                onLockIn={handleLockIn}
                disabled={!isMyTurn || gameState !== 'playing'}
                activeCategory={activeCategory}
            />

            <Keyboard
                onKeyPress={handlePlayerKeyPress}
                disabled={!isMyTurn || gameState !== 'playing'}
            />

            {gameState === 'game_over' && (
                <TouchableOpacity style={styles.exitButton} onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.exitText}>EXIT TO MENU</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#ff3333',
        letterSpacing: 4,
        fontWeight: 'bold',
    },
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#111',
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    roomText: {
        color: '#ffaa00',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    pauseIconContainer: {
        paddingHorizontal: 10,
    },
    pauseIconText: {
        color: '#888',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    turnContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    turnIndicator: {
        color: '#ffffff',
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    timerText: {
        color: '#aaaaaa',
        fontWeight: 'bold',
        marginLeft: 15,
        fontSize: 16,
    },
    timerDanger: {
        color: '#ff3333',
    },
    exitButton: {
        alignSelf: 'center',
        marginVertical: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ff3333',
        borderRadius: 4,
    },
    exitText: {
        color: '#ff3333',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#111',
        padding: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginBottom: 30,
    },
    modalBtn: {
        backgroundColor: '#222',
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#444'
    },
    dangerBtn: {
        borderColor: '#ff3333',
        backgroundColor: '#2a0000',
    },
    modalBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 2,
    }
});
