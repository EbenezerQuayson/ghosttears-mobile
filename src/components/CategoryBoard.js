import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function CategoryBoard({
    categories,
    activeCategory,
    lockedWords,
    gameState,
    onSelectCategory,
    isMyTurn,
    currentFragment // keeping it in props in case, but no need to use it
}) {
    return (
        <View style={styles.container}>
            {categories.map((cat, index) => {
                const isActive = activeCategory === cat;
                const words = lockedWords[cat] || [];

                // Is this column selectable by the current player?
                // True if the game is playing, it's their turn, and no category is active yet.
                const isSelectable = !activeCategory && isMyTurn && gameState === 'playing';

                return (
                    <TouchableOpacity
                        key={`col-${index}`}
                        style={[
                            styles.column,
                            isActive ? styles.activeColumn : null,
                            !activeCategory && styles.idleColumn
                        ]}
                        disabled={!isSelectable}
                        onPress={() => onSelectCategory(cat)}
                    >
                        <View style={styles.headerBox}>
                            <Text style={[styles.headerText, isActive ? styles.activeHeaderText : null]}>
                                {cat.toUpperCase()}
                            </Text>
                        </View>

                        <ScrollView style={styles.wordList} showsVerticalScrollIndicator={false}>
                            {words.map((word, wIdx) => (
                                <Text key={`word-${wIdx}`} style={styles.lockedWord}>
                                    {word}
                                </Text>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 180, // Restricted height for Active Play Area room
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 5,
        paddingTop: 10,
        backgroundColor: '#0a0a0a',
    },
    column: {
        flex: 1,
        marginHorizontal: 2,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        backgroundColor: '#0f0f0f',
        borderRadius: 4,
        overflow: 'hidden',
    },
    idleColumn: {
        borderColor: '#333333',
    },
    activeColumn: {
        borderColor: '#ff3333',
        backgroundColor: '#140000',
    },
    headerBox: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        alignItems: 'center',
    },
    headerText: {
        color: '#888',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    activeHeaderText: {
        color: '#ff3333',
    },
    wordList: {
        flex: 1,
        padding: 5,
    },
    lockedWord: {
        color: '#555',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 1,
        textDecorationLine: 'line-through',
    }
});
