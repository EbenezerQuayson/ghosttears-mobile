import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Alert, Platform, ScrollView } from 'react-native';

const CATEGORY_POOL = [
    { key: 'animals', label: 'Animals', color: '#6DC328', darkColor: '#4A8D15' },
    { key: 'countries', label: 'Countries', color: '#00A8B5', darkColor: '#007A84' },
    { key: 'fruits', label: 'Fruits', color: '#FFA114', darkColor: '#D77500' },
    { key: 'vegetables', label: 'Vegetables', color: '#E056FD', darkColor: '#B033CC' }
];

const TIMERS = [15, 30, 60];
const DIFFICULTIES = [
    { key: 'novice', label: 'Novice' },
    { key: 'intermediate', label: 'Medium' },
    { key: 'expert', label: 'Expert' }
];

export default function SetupScreen({ navigation, route }) {
    const { mode } = route.params;

    const [selectedTimer, setSelectedTimer] = useState(30);
    const [selectedCategories, setSelectedCategories] = useState(['animals', 'countries', 'fruits', 'vegetables']);
    const [numBots, setNumBots] = useState(1);
    const [difficulty, setDifficulty] = useState('intermediate');

    const toggleCategory = (cat) => {
        setSelectedCategories(prev => {
            if (prev.includes(cat)) {
                if (prev.length === 1) {
                    Alert.alert('Hold on', 'At least 1 category must remain active.');
                    return prev;
                }
                return prev.filter(c => c !== cat);
            } else {
                if (prev.length >= 4) {
                    Alert.alert('Max reached', 'Up to 4 categories can be active.');
                    return prev;
                }
                return [...prev, cat];
            }
        });
    };

    const handleContinue = () => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.activeElement?.blur?.();
        }
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
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Header Ribbon Banner */}
                <View style={styles.bannerContainer}>
                    <View style={styles.bannerWingLeft} />
                    <View style={styles.bannerMain}>
                        <Text style={styles.bannerText}>
                            {mode === 'single' ? 'SOLO SETUP' : 'HOST SETUP'}
                        </Text>
                    </View>
                    <View style={styles.bannerWingRight} />
                </View>

                {/* Dialog Window */}
                <View style={styles.card}>
                    
                    {/* Bot Count */}
                    {mode === 'single' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>OPPONENT BOTS</Text>
                            <View style={styles.optionsRow}>
                                {[1, 2, 3].map(num => {
                                    const isSelected = numBots === num;
                                    return (
                                        <Pressable
                                            key={`bot-${num}`}
                                            style={({ pressed }) => [
                                                styles.chip3D,
                                                isSelected ? styles.chipSelectedGreen : styles.chipInactive,
                                                pressed && styles.chipPressed
                                            ]}
                                            onPress={() => setNumBots(num)}
                                        >
                                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                                {num} {num === 1 ? 'Bot' : 'Bots'}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Difficulty */}
                    {mode === 'single' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>AI DIFFICULTY</Text>
                            <View style={styles.optionsRow}>
                                {DIFFICULTIES.map(item => {
                                    const isSelected = difficulty === item.key;
                                    return (
                                        <Pressable
                                            key={`diff-${item.key}`}
                                            style={({ pressed }) => [
                                                styles.chip3D,
                                                isSelected ? styles.chipSelectedTeal : styles.chipInactive,
                                                pressed && styles.chipPressed
                                            ]}
                                            onPress={() => setDifficulty(item.key)}
                                        >
                                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                                {item.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Timer */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>TURN TIMER</Text>
                        <View style={styles.optionsRow}>
                            {TIMERS.map(time => {
                                const isSelected = selectedTimer === time;
                                return (
                                    <Pressable
                                        key={`timer-${time}`}
                                        style={({ pressed }) => [
                                            styles.chip3D,
                                            isSelected ? styles.chipSelectedOrange : styles.chipInactive,
                                            pressed && styles.chipPressed
                                        ]}
                                        onPress={() => setSelectedTimer(time)}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                            {time}s
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Categories */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>ACTIVE CATEGORIES</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORY_POOL.map(cat => {
                                const isSelected = selectedCategories.includes(cat.key);
                                return (
                                    <Pressable
                                        key={cat.key}
                                        style={({ pressed }) => [
                                            styles.categoryCard,
                                            isSelected ? { backgroundColor: cat.color, borderBottomColor: cat.darkColor } : styles.categoryCardInactive,
                                            pressed && styles.chipPressed
                                        ]}
                                        onPress={() => toggleCategory(cat.key)}
                                    >
                                        <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                                            {isSelected && <Text style={styles.checkmarkText}>✓</Text>}
                                        </View>
                                        <Text style={[styles.categoryCardText, isSelected ? styles.categoryCardTextSelected : styles.categoryCardTextInactive]}>
                                            {cat.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.btn3D,
                                styles.greenBtn,
                                pressed && styles.btn3DPressed
                            ]}
                            onPress={handleContinue}
                        >
                            <Text style={styles.btnText}>
                                {mode === 'single' ? 'START GAME' : 'CREATE ROOM'}
                            </Text>
                        </Pressable>

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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F3E7',
    },
    scrollContent: {
        flexGrow: 1,
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
    bannerWingLeft: {
        width: 16,
        height: 34,
        backgroundColor: '#007A84',
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
        marginRight: -4,
        transform: [{ translateY: 3 }],
    },
    bannerWingRight: {
        width: 16,
        height: 34,
        backgroundColor: '#007A84',
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
        marginLeft: -4,
        transform: [{ translateY: 3 }],
    },
    bannerMain: {
        backgroundColor: '#00A8B5',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 14,
        borderBottomWidth: 4,
        borderBottomColor: '#007A84',
        zIndex: 10,
    },
    bannerText: {
        color: '#FFFFFF',
        fontSize: 24,
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
    section: {
        marginBottom: 18,
    },
    sectionLabel: {
        color: '#8C7E6A',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chip3D: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' }
        })
    },
    chipPressed: {
        transform: [{ translateY: 2 }],
        borderBottomWidth: 2,
    },
    chipInactive: {
        backgroundColor: '#F2EDE1',
        borderBottomWidth: 4,
        borderBottomColor: '#DDD6C4',
        borderWidth: 1,
        borderColor: '#E6DFCC',
    },
    chipSelectedGreen: {
        backgroundColor: '#6DC328',
        borderBottomWidth: 4,
        borderBottomColor: '#4A8D15',
    },
    chipSelectedTeal: {
        backgroundColor: '#00A8B5',
        borderBottomWidth: 4,
        borderBottomColor: '#007A84',
    },
    chipSelectedOrange: {
        backgroundColor: '#FFA114',
        borderBottomWidth: 4,
        borderBottomColor: '#D77500',
    },
    chipText: {
        color: '#7C6F5A',
        fontSize: 13,
        fontWeight: '800',
    },
    chipTextSelected: {
        color: '#FFFFFF',
        ...Platform.select({
            web: { textShadow: '0px 1px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
            }
        }),
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryCard: {
        flexBasis: '48%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderBottomWidth: 4,
        gap: 8,
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' }
        })
    },
    categoryCardInactive: {
        backgroundColor: '#F2EDE1',
        borderBottomColor: '#DDD6C4',
        borderWidth: 1,
        borderColor: '#E6DFCC',
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#E5DFCE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleSelected: {
        backgroundColor: '#FFFFFF',
    },
    checkmarkText: {
        color: '#333333',
        fontSize: 12,
        fontWeight: '900',
    },
    categoryCardText: {
        fontSize: 14,
        fontWeight: '800',
    },
    categoryCardTextSelected: {
        color: '#FFFFFF',
        ...Platform.select({
            web: { textShadow: '0px 1px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
            }
        }),
    },
    categoryCardTextInactive: {
        color: '#7C6F5A',
    },
    actions: {
        marginTop: 10,
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
    neutralBtn: {
        backgroundColor: '#EAE4D3',
        borderBottomWidth: 4,
        borderBottomColor: '#CFC7B4',
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
