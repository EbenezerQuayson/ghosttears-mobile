import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';

const CATEGORY_POOL = ['animals', 'countries', 'fruits', 'vegetables'];
const TIMERS = [15, 30, 60];

export default function SetupScreen({ navigation, route }) {
    const { mode } = route.params; // 'single' or 'host'

    const [selectedTimer, setSelectedTimer] = useState(30);
    const [selectedCategories, setSelectedCategories] = useState(['animals', 'countries', 'fruits', 'vegetables']);
    const [numBots, setNumBots] = useState(1);
    const [difficulty, setDifficulty] = useState('intermediate');

    const toggleCategory = (cat) => {
        setSelectedCategories(prev => {
            if (prev.includes(cat)) {
                if (prev.length === 1) {
                    Alert.alert('Hold on', 'You must select at least 1 category.');
                    return prev;
                }
                return prev.filter(c => c !== cat);
            } else {
                if (prev.length >= 4) {
                    Alert.alert('Max Categories', 'You can only select up to 4 categories.');
                    return prev;
                }
                return [...prev, cat];
            }
        });
    };

    const handleContinue = () => {
        const gameSettings = {
            turnTimer: selectedTimer,
            categories: selectedCategories,
            numBots: mode === 'single' ? numBots : 0,
            difficulty: mode === 'single' ? difficulty : null
        };

        if (mode === 'single') {
            navigation.replace('Game', { mode: 'single', gameSettings, gameId: `single_${Date.now()}` });
        } else if (mode === 'host') {
            navigation.replace('Lobby', { mode: 'host', gameSettings });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.title}>GAME SETUP</Text>

            {mode === 'single' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>NUMBER OF AI PLAYERS</Text>
                    <View style={styles.row}>
                        {[1, 2, 3].map(num => (
                            <TouchableOpacity
                                key={`bots-${num}`}
                                style={[styles.timerButton, numBots === num && styles.activeButton]}
                                onPress={() => setNumBots(num)}
                            >
                                <Text style={[styles.timerText, numBots === num && styles.activeText]}>
                                    {num}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {mode === 'single' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI DIFFICULTY</Text>
                    <View style={styles.row}>
                        {['novice', 'intermediate', 'expert'].map(level => (
                            <TouchableOpacity
                                key={`diff-${level}`}
                                style={[styles.timerButton, { paddingHorizontal: 15 }, difficulty === level && styles.activeButton]}
                                onPress={() => setDifficulty(level)}
                            >
                                <Text style={[styles.timerText, { fontSize: 14 }, difficulty === level && styles.activeText]}>
                                    {level.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>TURN TIMER</Text>
                <View style={styles.row}>
                    {TIMERS.map(time => (
                        <TouchableOpacity
                            key={`time-${time}`}
                            style={[styles.timerButton, selectedTimer === time && styles.activeButton]}
                            onPress={() => setSelectedTimer(time)}
                        >
                            <Text style={[styles.timerText, selectedTimer === time && styles.activeText]}>
                                {time}s
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACTIVE CATEGORIES</Text>
                <View style={styles.grid}>
                    {CATEGORY_POOL.map(cat => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                            <TouchableOpacity
                                key={`cat-${cat}`}
                                style={[styles.categoryButton, isSelected && styles.activeButton]}
                                onPress={() => toggleCategory(cat)}
                            >
                                <Text style={[styles.categoryText, isSelected && styles.activeText]}>
                                    {cat.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueText}>
                    {mode === 'single' ? 'START GAME' : 'CREATE ROOM'}
                </Text>
            </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>BACK TO MENU</Text>
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
    section: {
        width: '100%',
        marginBottom: 40,
        alignItems: 'center',
    },
    sectionTitle: {
        color: '#8B5CF6',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
    },
    timerButton: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderWidth: 2,
        borderColor: '#3B3663',
        borderRadius: 20,
        backgroundColor: '#252243',
    },
    categoryButton: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderWidth: 2,
        borderColor: '#3B3663',
        borderRadius: 20,
        backgroundColor: '#252243',
        minWidth: '40%',
        alignItems: 'center',
    },
    activeButton: {
        borderColor: '#2DD4BF',
        backgroundColor: '#1d3b41',
    },
    timerText: {
        color: '#a1a1aa',
        fontWeight: '900',
        fontSize: 18,
    },
    categoryText: {
        color: '#a1a1aa',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    activeText: {
        color: '#2DD4BF',
    },
    continueButton: {
        backgroundColor: '#FFC107',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 20,
        width: '80%',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#FFC107',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    continueText: {
        color: '#18152E',
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 18,
    },
    cancelButton: {
        marginTop: 30,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#3B3663',
    },
    cancelText: {
        color: '#a1a1aa',
        fontWeight: '900',
        letterSpacing: 1,
    }
});
