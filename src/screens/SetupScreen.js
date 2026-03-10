import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';

const CATEGORY_POOL = ['animals', 'countries', 'fruits', 'vegetables'];
const TIMERS = [15, 30, 60];

export default function SetupScreen({ navigation, route }) {
    const { mode } = route.params; // 'single' or 'host'

    const [selectedTimer, setSelectedTimer] = useState(30);
    const [selectedCategories, setSelectedCategories] = useState(['animals', 'countries', 'fruits', 'vegetables']);

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
            categories: selectedCategories
        };

        if (mode === 'single') {
            navigation.replace('Game', { mode: 'single', gameSettings });
        } else if (mode === 'host') {
            navigation.replace('Lobby', { mode: 'host', gameSettings });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>GAME SETUP</Text>

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
    section: {
        width: '100%',
        marginBottom: 40,
        alignItems: 'center',
    },
    sectionTitle: {
        color: '#ff3333',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 15,
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 4,
        backgroundColor: '#111111',
    },
    categoryButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 4,
        backgroundColor: '#111111',
        minWidth: '40%',
        alignItems: 'center',
    },
    activeButton: {
        borderColor: '#ff3333',
        backgroundColor: '#1a0000',
    },
    timerText: {
        color: '#888888',
        fontWeight: 'bold',
        fontSize: 16,
    },
    categoryText: {
        color: '#888888',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    activeText: {
        color: '#ffffff',
    },
    continueButton: {
        backgroundColor: '#ff3333',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 4,
        width: '80%',
        alignItems: 'center',
        marginTop: 20,
    },
    continueText: {
        color: '#ffffff',
        fontWeight: 'bold',
        letterSpacing: 2,
        fontSize: 16,
    },
    cancelButton: {
        marginTop: 20,
        paddingVertical: 10,
    },
    cancelText: {
        color: '#888888',
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
