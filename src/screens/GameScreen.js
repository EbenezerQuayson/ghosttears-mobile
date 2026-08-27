import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import Keyboard from '../components/Keyboard';
import CategoryBoard from '../components/CategoryBoard';
import ActivePlayArea from '../components/ActivePlayArea';
import Scoreboard from '../components/Scoreboard';
import useResponsive from '../hooks/useResponsive';
import gameDictionary, { initializeDictionary } from '../engine/WordEngine';
import MultiplayerEngine from '../engine/MultiplayerEngine';

export default function GameScreen({ route, navigation }) {
    const { mode, roomCode, playerId, gameSettings } = route?.params || { mode: 'single' };
    const isMultiplayer = mode === 'multiplayer';
    const { isDesktop } = useResponsive();

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

        if (key === '⌫' || key === 'BACKSPACE') {
            setPendingLetter(null);
        } else {
            setPendingLetter(key);
        }
    };

    const handleLockIn = async () => {
        if (!pendingLetter) return;
        if (!isMultiplayer) {
            processMoveSingle(currentFragment + pendingLetter, 'player', activeCategory);
        } else {
            await processMoveMulti(currentFragment + pendingLetter, activeCategory);
        }
    };

    // Web Physical Keyboard Hook
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleKeyDown = (e) => {
            // Ignore if typing in an input field (not relevant here but good practice)
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                handleLockIn();
            } else if (e.key === 'Escape') {
                if (gameState === 'challenged') {
                    // Logic to cancel bluff challenge if it existed
                    console.log('Cancel challenge triggered');
                } else if (showPauseModal) {
                    setShowPauseModal(false);
                    togglePause();
                } else {
                    setShowPauseModal(true);
                    if (!isPaused) togglePause();
                }
            } else if (e.key === 'Backspace') {
                handlePlayerKeyPress('BACKSPACE');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                handlePlayerKeyPress(e.key.toUpperCase());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePlayerKeyPress, handleLockIn, gameState, showPauseModal, isPaused]);

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
            { id: 'host', label: playerId === 'host' ? 'P1 (YOU)' : 'Player 1', score: playerId === 'host' ? playerLives.player : playerLives.bot },
            { id: 'guest', label: playerId === 'guest' ? 'P2 (YOU)' : 'Player 2', score: playerId === 'guest' ? playerLives.player : playerLives.bot },
        ]
        : [
            { id: 'player', label: 'YOU', score: playerLives.player },
            { id: 'bot', label: 'AI', score: playerLives.bot },
        ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ width: '100%', maxWidth: isDesktop ? 1000 : 480, alignSelf: 'center', flex: 1, paddingVertical: 20 }}>
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

            {isDesktop ? (
                <View style={{ flexDirection: 'row', gap: 40, alignItems: 'stretch', flex: 1 }}>
                    <View style={{ flex: 1 }}>
                        <CategoryBoard
                            categories={selectedCategories}
                            activeCategory={activeCategory}
                            lockedWords={lockedWords}
                            gameState={gameState}
                            onSelectCategory={handleCategorySelect}
                            isMyTurn={isMyTurn}
                            isDesktop={isDesktop}
                        />
                    </View>
                    <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'flex-start' }}>
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
                    </View>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <CategoryBoard
                        categories={selectedCategories}
                        activeCategory={activeCategory}
                        lockedWords={lockedWords}
                        gameState={gameState}
                        onSelectCategory={handleCategorySelect}
                        isMyTurn={isMyTurn}
                        isDesktop={isDesktop}
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
                </View>
            )}

            {gameState === 'game_over' && (
                <TouchableOpacity style={styles.exitButton} onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.exitText}>EXIT TO MENU</Text>
                </TouchableOpacity>
            )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFC107',
        letterSpacing: 4,
        fontWeight: 'bold',
    },
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#252243',
        borderBottomWidth: 1,
        borderBottomColor: '#3B3663',
    },
    roomText: {
        color: '#FFC107',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    pauseIconContainer: {
        paddingHorizontal: 10,
    },
    pauseIconText: {
        color: '#8B5CF6',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    turnContainer: {
        alignItems: 'center',
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    turnIndicator: {
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: 2,
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        overflow: 'hidden',
    },
    timerText: {
        color: '#A5B4FC',
        fontWeight: '900',
        marginLeft: 15,
        fontSize: 16,
    },
    timerDanger: {
        color: '#F43F5E',
    },
    exitButton: {
        alignSelf: 'center',
        marginVertical: 15,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderWidth: 2,
        borderColor: '#8B5CF6',
        borderRadius: 20,
    },
    exitText: {
        color: '#8B5CF6',
        fontWeight: '900',
        letterSpacing: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(24, 21, 46, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#252243',
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3B3663',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 40,
    },
    modalBtn: {
        backgroundColor: '#18152E',
        paddingVertical: 18,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3B3663'
    },
    dangerBtn: {
        borderColor: '#F43F5E',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
    },
    modalBtnText: {
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: 2,
    }
});
