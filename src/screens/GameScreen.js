import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Platform, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Keyboard from '../components/Keyboard';
import CategoryBoard from '../components/CategoryBoard';
import ActivePlayArea from '../components/ActivePlayArea';
import Scoreboard from '../components/Scoreboard';
import useResponsive from '../hooks/useResponsive';
import gameDictionary, { initializeDictionary } from '../engine/WordEngine';
import MultiplayerEngine from '../engine/MultiplayerEngine';

export default function GameScreen({ route, navigation }) {
    const { mode, gameSettings, roomCode, playerId, initialPlayers, gameId } = route.params;
    const isMultiplayer = mode === 'multiplayer';
    const { isDesktop } = useResponsive();

    // Fallback settings if not provided
    const settings = gameSettings || { turnTimer: 30, categories: ['animals', 'countries', 'fruits', 'vegetables'], numBots: 1, difficulty: 'intermediate' };

    const [isInitializing, setIsInitializing] = useState(true);
    const [engine, setEngine] = useState(null);

    // Core Game State
    const [selectedCategories] = useState(settings.categories);
    const [activeCategory, setActiveCategory] = useState(null);
    const [lockedWords, setLockedWords] = useState({ animals: [], countries: [], fruits: [], vegetables: [] });
    const [currentFragment, setCurrentFragment] = useState('');
    const [pendingLetter, setPendingLetter] = useState(null);

    // Meta Game State
    const initNames = {};
    let initLives = { player: 0 };
    let initTurnOrder = ['player'];
    if (isMultiplayer && initialPlayers) {
        initLives = {};
        initTurnOrder = [];
        initialPlayers.forEach(p => {
            initLives[p.id] = p.penalty;
            initTurnOrder.push(p.id);
            initNames[p.id] = p.name;
        });
    } else if (!isMultiplayer) {
        for (let i = 1; i <= (settings.numBots || 1); i++) {
            initLives[`bot${i}`] = 0;
            initTurnOrder.push(`bot${i}`);
        }
    }

    const [playerNames] = useState(initNames);
    const [playerLives, setPlayerLives] = useState(initLives);
    const [turnOrder, setTurnOrder] = useState(initTurnOrder);
    const [playerTurn, setPlayerTurn] = useState(isMultiplayer ? initTurnOrder[0] : 'player');
    const [gameState, setGameState] = useState('playing'); // 'playing', 'challenged', 'game_over'
    const [turnTimer, setTurnTimer] = useState(settings.turnTimer);
    const [turnEndsAt, setTurnEndsAt] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [latestEvent, setLatestEvent] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const getNextPlayer = (currentPlayer, currentTurnOrder) => {
        const index = currentTurnOrder.indexOf(currentPlayer);
        if (index === -1) return currentTurnOrder[0];
        return currentTurnOrder[(index + 1) % currentTurnOrder.length];
    };

    // Init Dictionary and Load Local State
    useEffect(() => {
        setTimeout(async () => {
            initializeDictionary();
            if (!isMultiplayer && gameId) {
                try {
                    const saved = await AsyncStorage.getItem(`GHOSTTEARS_SP_${gameId}`);
                    if (saved) {
                        const state = JSON.parse(saved);
                        setPlayerLives(state.playerLives || initLives);
                        setTurnOrder(state.turnOrder || initTurnOrder);
                        setPlayerTurn(state.playerTurn || 'player');
                        setGameState(state.gameState || 'playing');
                        setLockedWords(state.lockedWords || { animals: [], countries: [], fruits: [], vegetables: [] });
                        setCurrentFragment(state.currentFragment || '');
                        setActiveCategory(state.activeCategory || null);
                        if (state.turnEndsAt) setTurnEndsAt(state.turnEndsAt);
                    }
                } catch(e) {
                    console.error('Failed to load local state', e);
                }
            }
            setIsInitializing(false);
        }, 100);
    }, []);

    // Save Local State
    useEffect(() => {
        if (!isMultiplayer && !isInitializing && gameId) {
            const stateToSave = {
                playerLives,
                turnOrder,
                playerTurn,
                gameState,
                lockedWords,
                currentFragment,
                activeCategory,
                turnEndsAt
            };
            AsyncStorage.setItem(`GHOSTTEARS_SP_${gameId}`, JSON.stringify(stateToSave)).catch(e => console.error(e));
        }
    }, [playerLives, turnOrder, playerTurn, gameState, lockedWords, currentFragment, activeCategory, turnEndsAt, isInitializing, isMultiplayer, gameId]);

    // Timer Hook
    useEffect(() => {
        let animationFrameId;

        const updateTimer = () => {
            if (gameState === 'playing' && activeCategory && turnEndsAt && !isPaused) {
                const remainingRaw = turnEndsAt - Date.now();
                const remainingSecs = Math.max(0, Math.ceil(remainingRaw / 1000));

                setTurnTimer(remainingSecs);

                if (remainingRaw <= 0) {
                    if (isMultiplayer && playerTurn !== playerId) {
                        // Keep running to check for disconnects
                        if (playerId === turnOrder[0] && remainingRaw <= -3000) {
                            handleDisconnectTimeout();
                        } else {
                            animationFrameId = requestAnimationFrame(updateTimer);
                        }
                    } else {
                        handleTimeout();
                    }
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
    }, [turnEndsAt, gameState, activeCategory, isPaused, isMultiplayer, playerTurn, playerId, turnOrder]);

    // Engine Init
    useEffect(() => {
        if (isMultiplayer && roomCode && playerId && !isInitializing) {
            const multiEngine = new MultiplayerEngine(roomCode, playerId, (newRoom) => {
                
                // Track if we just got eliminated
                const myOldPenalty = playerLives[playerId] || 0;
                const myNewPenalty = newRoom.players.find(p => p.id === playerId)?.penalty || 0;
                
                const newLives = {};
                newRoom.players.forEach(p => newLives[p.id] = p.penalty);
                setPlayerLives(newLives);

                // Update active turn order (eliminate players with >= 10)
                const activeTurnOrder = newRoom.players.filter(p => p.penalty < 10).map(p => p.id);
                setTurnOrder(activeTurnOrder);

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

                if (myNewPenalty >= 10 && myOldPenalty < 10 && activeTurnOrder.length > 1) {
                    Toast.show({ type: 'error', text1: 'Eliminated!', text2: 'You have been eliminated! Spectating remaining players.' });
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
                    setPendingLetter(null);
                }
            });
            multiEngine.subscribe();
            multiEngine.syncInitialState();
            setEngine(multiEngine);

            return () => multiEngine.unsubscribe();
        }
    }, [isMultiplayer, roomCode, playerId, isInitializing, playerLives]);

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

    const handleDisconnectTimeout = () => {
        setTurnEndsAt(null);
        
        const newPlayersList = initialPlayers.map(p => {
            if (p.id === playerTurn) return { ...p, penalty: playerLives[playerTurn] + 1 };
            return { ...p, penalty: playerLives[p.id] };
        });
        
        const nextTurn = getNextPlayer(playerTurn, turnOrder);
        
        const title = 'Player Timeout / Disconnected';
        const message = `${playerNames[playerTurn]} took too long or disconnected.`;
        engine.sendEvent(title, message, 'error');
        
        engine.sendPenalty(newPlayersList, nextTurn, null);
    };

    const handleTimeout = () => {
        // Prevent double execution
        setTurnEndsAt(null);

        // Only run timeout logic if it's currently single player, or if it's our turn in multi
        if (!isMultiplayer && playerTurn === 'player') {
            processTimeoutSingle('player', activeCategory);
        } else if (!isMultiplayer && playerTurn.startsWith('bot')) {
            processTimeoutSingle(playerTurn, activeCategory);
        } else if (isMultiplayer && playerTurn === playerId) {
            processTimeoutMulti(activeCategory);
        }
    };

    const quitMultiplayerMatch = async () => {
        if (!isMultiplayer || !engine) return;

        // If game is already over or we are already eliminated, just silently leave locally.
        if (gameState === 'game_over' || playerLives[playerId] >= 10) {
            engine.unsubscribe();
            return;
        }

        // Otherwise, penalize self to 10 (eliminate) and pass turn
        const newPlayersList = initialPlayers.map(p => {
            if (p.id === playerId) return { ...p, penalty: 10 };
            return { ...p, penalty: playerLives[p.id] };
        });
        
        await engine.sendEvent('Player Left', `${playerNames[playerId]} abandoned the match.`, 'error');
        
        const nextTurn = playerTurn === playerId ? getNextPlayer(playerId, turnOrder) : playerTurn;
        await engine.sendPenalty(newPlayersList, nextTurn, null);
        engine.unsubscribe();
    };

    const resetRoundSingle = (loser, wordToLock, categoryToLock) => {
        const newLives = { ...playerLives, [loser]: playerLives[loser] + 1 };
        setPlayerLives(newLives);

        if (wordToLock && categoryToLock) {
            setLockedWords(prev => ({
                ...prev,
                [categoryToLock]: [...prev[categoryToLock], wordToLock]
            }));
        }

        let newTurnOrder = [...turnOrder];
        if (newLives[loser] >= 10) {
            newTurnOrder = newTurnOrder.filter(p => p !== loser);
            setTurnOrder(newTurnOrder);
            Toast.show({ type: 'error', text1: 'Eliminated!', text2: `${loser === 'player' ? 'YOU' : loser.replace('bot', 'AI ').toUpperCase()} reached 10 penalties and ${loser === 'player' ? 'are' : 'is'} out.` });
        }

        if (newTurnOrder.length <= 1) {
            setGameState('game_over');
        } else {
            setTimeout(() => {
                setCurrentFragment('');
                setPendingLetter(null);
                setActiveCategory(null);
                setTurnEndsAt(null);
                const nextTurn = newLives[loser] >= 10 ? getNextPlayer(loser, turnOrder) : loser;
                setPlayerTurn(newTurnOrder.includes(nextTurn) ? nextTurn : newTurnOrder[0]);
                
                if (loser === 'player' && newLives.player >= 10) {
                    setGameState('spectate_prompt');
                } else {
                    setGameState('playing');
                }
            }, 2000);
        }
    };

    const processTimeoutSingle = (loser, category) => {
        Toast.show({ type: 'error', text1: 'Time is up!', text2: `${loser === 'player' ? 'YOU take' : 'AI takes'} a penalty.` });
        resetRoundSingle(loser, currentFragment, category);
    };

    // Local Bot Hook
    useEffect(() => {
        if (!isMultiplayer && gameState === 'playing' && playerTurn.startsWith('bot') && !isPaused) {
            // Give bot 1 to 2 seconds to "think"
            const botDelay = Math.floor(Math.random() * 1000) + 1000;
            const botTimer = setTimeout(() => {
                let targetCategory = activeCategory;
                if (!targetCategory) {
                    targetCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
                    setActiveCategory(targetCategory);
                }

                const diff = settings.difficulty || 'intermediate';
                const nextLetter = gameDictionary.getAIMove(targetCategory, currentFragment, lockedWords[targetCategory], diff, turnOrder.length);
                if (!nextLetter) {
                    const fallback = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
                    processMoveSingle(currentFragment + fallback, playerTurn, targetCategory);
                } else {
                    processMoveSingle(currentFragment + nextLetter, playerTurn, targetCategory);
                }
            }, botDelay);
            return () => clearTimeout(botTimer);
        }
    }, [playerTurn, gameState, currentFragment, activeCategory, isMultiplayer, isPaused]);

    // ==========================================
    // MULTIPLAYER LOGIC (With Categories)
    // ==========================================
    const processMoveMulti = (newFragment, category) => {
        setCurrentFragment(newFragment);
        setPendingLetter(null);
        setTurnEndsAt(Date.now() + settings.turnTimer * 1000);
        setPlayerTurn(getNextPlayer(playerId, turnOrder));

        const status = gameDictionary.checkStatus(category, newFragment, lockedWords[category]);

        if (status === 'COMPLETE_WORD' || status === 'INVALID') {
            const newPlayersList = initialPlayers.map(p => {
                if (p.id === playerId) return { ...p, penalty: playerLives[playerId] + 1 };
                return { ...p, penalty: playerLives[p.id] };
            });
            const nextTurn = getNextPlayer(playerId, turnOrder);
            
            const isInvalid = status === 'INVALID';
            const title = isInvalid ? 'Bluff Caught!' : 'Word Completed!';
            const message = `"${newFragment}" is ${isInvalid ? 'not a valid prefix for' : 'a valid'} ${category}. ${playerNames[playerId]} takes a penalty.`;
            engine.sendEvent(title, message, 'error');

            if (status === 'COMPLETE_WORD') {
                engine.sendPenalty(newPlayersList, nextTurn, { ...lockedWords, [category]: [...lockedWords[category], newFragment] });
            } else {
                engine.sendPenalty(newPlayersList, nextTurn, null); // Don't lock bluffs
            }
        } else {
            engine.sendMove(newFragment, category, getNextPlayer(playerId, turnOrder), settings.turnTimer);
        }
    };

    const processTimeoutMulti = (category) => {
        const newPlayersList = initialPlayers.map(p => {
            if (p.id === playerId) return { ...p, penalty: playerLives[playerId] + 1 };
            return { ...p, penalty: playerLives[p.id] };
        });
        const nextTurn = getNextPlayer(playerId, turnOrder);
        
        const title = 'Time is up!';
        const message = `${playerNames[playerId]} takes a penalty.`;
        engine.sendEvent(title, message, 'error');
        
        engine.sendPenalty(newPlayersList, nextTurn, null);
    };

    // ==========================================
    // SINGLE PLAYER LOGIC (With Categories)
    // ==========================================
    const processMoveSingle = (newFragment, currentPlayer, category) => {
        setCurrentFragment(newFragment);
        setPendingLetter(null);
        setTurnEndsAt(Date.now() + settings.turnTimer * 1000);

        const status = gameDictionary.checkStatus(category, newFragment, lockedWords[category]);

        if (status === 'COMPLETE_WORD') {
            setGameState('challenged');
            Toast.show({ type: 'error', text1: 'Word Completed!', text2: `"${newFragment}" is a valid ${category}. ${currentPlayer === 'player' ? 'You take' : currentPlayer.toUpperCase() + ' takes'} a penalty.` });
            resetRoundSingle(currentPlayer, newFragment, category); // Lock the valid word
        } else if (status === 'INVALID') {
            setGameState('challenged');
            Toast.show({ type: 'error', text1: 'Bluff Caught!', text2: `"${newFragment}" is not a valid prefix for ${category}. ${currentPlayer === 'player' ? 'You take' : currentPlayer.toUpperCase() + ' takes'} a penalty.` });
            resetRoundSingle(currentPlayer, null, null); // Don't lock invalid bluffs
        } else {
            setPlayerTurn(getNextPlayer(currentPlayer, turnOrder));
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
                    setConfirmAction(null);
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
                <ActivityIndicator size="large" color="#FFA114" />
                <Text style={styles.loadingText}>LOADING LEXICON...</Text>
            </View>
        );
    }

    const players = isMultiplayer
        ? initialPlayers.map(p => ({
            id: p.id,
            label: p.id === playerId ? `${p.name} (YOU)` : p.name,
            score: playerLives[p.id],
            eliminated: playerLives[p.id] >= 10
        }))
        : Object.keys(playerLives).map((key) => ({
            id: key,
            label: key === 'player' ? 'YOU' : `AI ${key.replace('bot', '')}`,
            score: playerLives[key],
            eliminated: playerLives[key] >= 10
        }));

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={{ width: '100%', maxWidth: isDesktop ? 1000 : 440, alignSelf: 'center', flex: 1, paddingVertical: 12, paddingHorizontal: 12 }}>
                    
                    {/* Top Game Bar */}
                    <View style={styles.roomHeader}>
                        <View style={styles.roomTag}>
                            <View style={styles.liveDot} />
                            <Text style={styles.roomText}>
                                {isMultiplayer ? `ROOM ${roomCode}` : 'SOLO PRACTICE'}
                            </Text>
                        </View>
                        <Pressable
                            style={({ pressed }) => [
                                styles.pauseBtn,
                                pressed && styles.pauseBtnPressed
                            ]}
                            onPress={() => {
                                if (Platform.OS === 'web' && typeof document !== 'undefined') document.activeElement?.blur();
                                setShowPauseModal(true);
                                if (!isPaused) togglePause();
                            }}
                        >
                            <Text style={styles.pauseBtnText}>PAUSE</Text>
                        </Pressable>
                    </View>

                    {/* Turn Status and Timer Bar */}
                    <View style={styles.turnBar}>
                        <View style={[
                            styles.turnPlaque,
                            isMyTurn ? styles.myTurnPlaque : styles.oppTurnPlaque
                        ]}>
                            <Text style={styles.turnPlaqueText}>
                                {gameState === 'game_over'
                                    ? 'MATCH CONCLUDED'
                                    : (isMyTurn ? (!activeCategory ? 'PICK A CATEGORY!' : 'YOUR TURN!') : (isMultiplayer ? "OPPONENT'S TURN" : `${playerTurn.replace('bot', 'AI ').toUpperCase()}'S TURN`))}
                            </Text>
                        </View>
                        {activeCategory && gameState === 'playing' && (
                            <View style={[styles.timerBadge, turnTimer <= 10 && styles.timerDangerBadge]}>
                                <Text style={styles.timerIcon}>⏳</Text>
                                <Text style={[styles.timerText, turnTimer <= 10 && styles.timerDangerText]}>
                                    00:{turnTimer.toString().padStart(2, '0')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Scoreboard */}
                    <Scoreboard players={players} />

                    {/* Pause Modal */}
                    <Modal visible={showPauseModal || isPaused} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalCard}>
                                <View style={styles.modalBanner}>
                                    <Text style={styles.modalBannerText}>PAUSED</Text>
                                </View>

                                {confirmAction === 'restart' ? (
                                    <>
                                        <Text style={styles.modalBody}>Restart match from beginning? Current penalties will reset.</Text>
                                        <Pressable
                                            style={({ pressed }) => [styles.btn3D, styles.orangeBtn, pressed && styles.btn3DPressed]}
                                            onPress={async () => {
                                                setConfirmAction(null);
                                                if (!isMultiplayer) {
                                                    setGameState('playing');
                                                    setPlayerLives(initLives);
                                                    setTurnOrder(initTurnOrder);
                                                    setLockedWords({ animals: [], countries: [], fruits: [], vegetables: [] });
                                                    setCurrentFragment('');
                                                    setActiveCategory(null);
                                                    setPlayerTurn('player');
                                                    setTurnEndsAt(null);
                                                    setTurnTimer(settings.turnTimer);
                                                    setPendingLetter(null);
                                                    setShowPauseModal(false);
                                                    setIsPaused(false);
                                                } else {
                                                    Toast.show({ type: 'info', text1: 'Restart functionality WIP.' });
                                                }
                                            }}
                                        >
                                            <Text style={styles.btnText}>YES, RESTART</Text>
                                        </Pressable>
                                        <Pressable style={({ pressed }) => [styles.btn3D, styles.neutralBtn, pressed && styles.btn3DPressed]} onPress={() => setConfirmAction(null)}>
                                            <Text style={styles.neutralBtnText}>CANCEL</Text>
                                        </Pressable>
                                    </>
                                ) : confirmAction === 'quit' ? (
                                    <>
                                        <Text style={styles.modalBody}>
                                            {isMultiplayer ? 'Quitting will forfeit the match for everyone in the room.' : 'Quit and return to main menu?'}
                                        </Text>
                                        <Pressable
                                            style={({ pressed }) => [styles.btn3D, styles.redBtn, pressed && styles.btn3DPressed]}
                                            onPress={async () => {
                                                setConfirmAction(null);
                                                setShowPauseModal(false);
                                                setIsPaused(false);
                                                if (isMultiplayer && engine) {
                                                    await quitMultiplayerMatch();
                                                }
                                                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                                            }}
                                        >
                                            <Text style={styles.btnText}>YES, QUIT</Text>
                                        </Pressable>
                                        <Pressable style={({ pressed }) => [styles.btn3D, styles.neutralBtn, pressed && styles.btn3DPressed]} onPress={() => setConfirmAction(null)}>
                                            <Text style={styles.neutralBtnText}>CANCEL</Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    <View style={styles.modalBtnGroup}>
                                        <Pressable
                                            style={({ pressed }) => [styles.btn3D, styles.greenBtn, pressed && styles.btn3DPressed]}
                                            onPress={() => {
                                                setShowPauseModal(false);
                                                setConfirmAction(null);
                                                togglePause();
                                            }}
                                        >
                                            <Text style={styles.btnText}>RESUME</Text>
                                        </Pressable>

                                        {(!isMultiplayer || playerId === 'host') && (
                                            <Pressable
                                                style={({ pressed }) => [styles.btn3D, styles.orangeBtn, pressed && styles.btn3DPressed]}
                                                onPress={() => setConfirmAction('restart')}
                                            >
                                                <Text style={styles.btnText}>RESTART MATCH</Text>
                                            </Pressable>
                                        )}

                                        <Pressable
                                            style={({ pressed }) => [styles.btn3D, styles.neutralBtn, pressed && styles.btn3DPressed]}
                                            onPress={() => setConfirmAction('quit')}
                                        >
                                            <Text style={styles.neutralBtnText}>QUIT TO MENU</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Modal>

                    {/* Spectate Modal */}
                    <Modal visible={gameState === 'spectate_prompt'} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalCard}>
                                <View style={[styles.modalBanner, { backgroundColor: '#FF4757', borderBottomColor: '#D63031' }]}>
                                    <Text style={styles.modalBannerText}>OUT OF LIVES</Text>
                                </View>
                                <Text style={styles.modalBody}>
                                    You received 10 penalties and completed GHOSTTEARS! You can spectate or start fresh.
                                </Text>

                                <View style={styles.modalBtnGroup}>
                                    <Pressable
                                        style={({ pressed }) => [styles.btn3D, styles.tealBtn, pressed && styles.btn3DPressed]}
                                        onPress={() => setGameState('playing')}
                                    >
                                        <Text style={styles.btnText}>SPECTATE BOTS</Text>
                                    </Pressable>

                                    <Pressable
                                        style={({ pressed }) => [styles.btn3D, styles.greenBtn, pressed && styles.btn3DPressed]}
                                        onPress={() => {
                                            setGameState('playing');
                                            setPlayerLives(initLives);
                                            setTurnOrder(initTurnOrder);
                                            setLockedWords({ animals: [], countries: [], fruits: [], vegetables: [] });
                                            setCurrentFragment('');
                                            setActiveCategory(null);
                                            setPlayerTurn('player');
                                            setTurnEndsAt(null);
                                            setTurnTimer(settings.turnTimer);
                                            setPendingLetter(null);
                                        }}
                                    >
                                        <Text style={styles.btnText}>RESTART MATCH</Text>
                                    </Pressable>

                                    <Pressable
                                        style={({ pressed }) => [styles.btn3D, styles.neutralBtn, pressed && styles.btn3DPressed]}
                                        onPress={async () => {
                                            if (isMultiplayer && engine) await quitMultiplayerMatch();
                                            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                                        }}
                                    >
                                        <Text style={styles.neutralBtnText}>QUIT TO MENU</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Game Over Modal */}
                    <Modal visible={gameState === 'game_over'} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalCard}>
                                <View style={[styles.modalBanner, { backgroundColor: '#FFA114', borderBottomColor: '#D77500' }]}>
                                    <Text style={styles.modalBannerText}>COMPLETED</Text>
                                </View>
                                
                                <Text style={styles.outcomeWinner}>
                                    {(isMultiplayer ? playerLives[playerId] : playerLives.player) >= 10 
                                        ? (isMultiplayer ? `${playerNames[turnOrder[0]] || 'Opponent'} WINS!` : `${turnOrder[0].replace('bot', 'AI ').toUpperCase()} WINS!`)
                                        : 'YOU WON! 🏆'}
                                </Text>

                                <View style={styles.modalBtnGroup}>
                                    {!isMultiplayer && (
                                        <Pressable
                                            style={({ pressed }) => [styles.btn3D, styles.greenBtn, pressed && styles.btn3DPressed]}
                                            onPress={() => {
                                                setGameState('playing');
                                                setPlayerLives(initLives);
                                                setTurnOrder(initTurnOrder);
                                                setLockedWords({ animals: [], countries: [], fruits: [], vegetables: [] });
                                                setCurrentFragment('');
                                                setActiveCategory(null);
                                                setPlayerTurn('player');
                                                setTurnEndsAt(null);
                                                setTurnTimer(settings.turnTimer);
                                                setPendingLetter(null);
                                            }}
                                        >
                                            <Text style={styles.btnText}>PLAY AGAIN</Text>
                                        </Pressable>
                                    )}

                                    <Pressable
                                        style={({ pressed }) => [styles.btn3D, styles.neutralBtn, pressed && styles.btn3DPressed]}
                                        onPress={async () => {
                                            if (isMultiplayer && engine) {
                                                await quitMultiplayerMatch();
                                            }
                                            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                                        }}
                                    >
                                        <Text style={styles.neutralBtnText}>RETURN TO MENU</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Game Layout */}
                    {isDesktop ? (
                        <View style={styles.desktopLayout}>
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
                        <View style={styles.mobileLayout}>
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

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F3E7',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F6F3E7',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#8C7E6A',
        letterSpacing: 2,
        fontSize: 13,
        fontWeight: '800',
    },
    roomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#E8E1CF',
        borderBottomWidth: 4,
        borderBottomColor: '#D8D0BC',
        marginBottom: 6,
    },
    roomTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6DC328',
    },
    roomText: {
        color: '#4A3E3D',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    pauseBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: '#EAE4D3',
        borderBottomWidth: 3,
        borderBottomColor: '#CFC7B4',
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' }
        })
    },
    pauseBtnPressed: {
        transform: [{ translateY: 2 }],
        borderBottomWidth: 1,
    },
    pauseBtnText: {
        color: '#7C6F5A',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    turnBar: {
        alignItems: 'center',
        paddingVertical: 6,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    turnPlaque: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 12,
        borderBottomWidth: 3,
    },
    myTurnPlaque: {
        backgroundColor: '#6DC328',
        borderBottomColor: '#4A8D15',
    },
    oppTurnPlaque: {
        backgroundColor: '#FFA114',
        borderBottomColor: '#D77500',
    },
    turnPlaqueText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
        ...Platform.select({
            web: { textShadow: '0px 1px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
            }
        }),
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E8E1CF',
        borderBottomWidth: 3,
        borderBottomColor: '#D4CBB4',
        gap: 4,
    },
    timerDangerBadge: {
        backgroundColor: '#FFF1F2',
        borderColor: '#FF4757',
        borderBottomColor: '#D63031',
    },
    timerIcon: {
        fontSize: 12,
    },
    timerText: {
        color: '#4A3E3D',
        fontWeight: '900',
        fontSize: 13,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    timerDangerText: {
        color: '#FF4757',
    },
    desktopLayout: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'stretch',
        flex: 1,
        marginTop: 6,
    },
    mobileLayout: {
        flex: 1,
        gap: 6,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(50, 40, 30, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#E8E1CF',
        borderBottomWidth: 6,
        borderBottomColor: '#D4CBB4',
        alignItems: 'center',
    },
    modalBanner: {
        backgroundColor: '#00A8B5',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 14,
        borderBottomWidth: 4,
        borderBottomColor: '#007A84',
        marginBottom: 14,
        marginTop: -30,
    },
    modalBannerText: {
        color: '#FFFFFF',
        fontSize: 18,
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
    },
    modalBody: {
        color: '#6E6152',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: 18,
        textAlign: 'center',
    },
    outcomeWinner: {
        color: '#6DC328',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalBtnGroup: {
        width: '100%',
        gap: 10,
    },
    btn3D: {
        width: '100%',
        paddingVertical: 13,
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
    tealBtn: {
        backgroundColor: '#00A8B5',
        borderBottomWidth: 5,
        borderBottomColor: '#007A84',
    },
    orangeBtn: {
        backgroundColor: '#FFA114',
        borderBottomWidth: 5,
        borderBottomColor: '#D77500',
    },
    redBtn: {
        backgroundColor: '#FF4757',
        borderBottomWidth: 5,
        borderBottomColor: '#D63031',
    },
    neutralBtn: {
        backgroundColor: '#EAE4D3',
        borderBottomWidth: 4,
        borderBottomColor: '#CFC7B4',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 16,
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
