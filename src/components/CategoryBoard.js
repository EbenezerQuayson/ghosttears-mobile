import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function CategoryBoard({
    categories,
    activeCategory,
    lockedWords,
    gameState,
    onSelectCategory,
    isMyTurn,
    isDesktop,
    currentFragment
}) {
    return (
        <View style={[styles.container, isDesktop && { height: '100%', minHeight: 400 }]}>
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
        height: 180,
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 10,
        paddingTop: 10,
        backgroundColor: 'transparent',
    },
    column: {
        flex: 1,
        marginHorizontal: 4,
        borderWidth: 2,
        borderColor: '#3B3663',
        backgroundColor: '#252243',
        borderRadius: 20,
        overflow: 'hidden',
    },
    idleColumn: {
        borderColor: '#18152E',
    },
    activeColumn: {
        borderColor: '#FFC107',
        backgroundColor: '#2D294E',
    },
    headerBox: {
        backgroundColor: '#18152E',
        paddingVertical: 12,
        alignItems: 'center',
    },
    headerText: {
        color: '#a1a1aa',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    activeHeaderText: {
        color: '#FFC107',
    },
    wordList: {
        flex: 1,
        padding: 10,
    },
    lockedWord: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: 1,
        textDecorationLine: 'line-through',
    }
});
