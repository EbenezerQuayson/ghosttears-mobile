import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';

const CATEGORY_COLORS = {
    animals: { top: '#6DC328', bottom: '#4A8D15' },
    countries: { top: '#00A8B5', bottom: '#007A84' },
    fruits: { top: '#FFA114', bottom: '#D77500' },
    vegetables: { top: '#E056FD', bottom: '#B033CC' }
};

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
        <View style={[styles.container, isDesktop && { height: '100%', minHeight: 380 }]}>
            {categories.map((cat, index) => {
                const isActive = activeCategory === cat;
                const words = lockedWords[cat] || [];
                const isSelectable = !activeCategory && isMyTurn && gameState === 'playing';
                const colors = CATEGORY_COLORS[cat] || { top: '#00A8B5', bottom: '#007A84' };

                return (
                    <Pressable
                        key={`cat-col-${index}`}
                        style={({ pressed }) => [
                            styles.column,
                            isActive && styles.columnActive,
                            isSelectable && styles.columnSelectable,
                            pressed && isSelectable && styles.columnPressed
                        ]}
                        disabled={!isSelectable}
                        onPress={() => onSelectCategory(cat)}
                    >
                        {/* Colorful Card Tab Header */}
                        <View style={[styles.headerBox, { backgroundColor: colors.top, borderBottomColor: colors.bottom }]}>
                            <Text style={styles.headerText}>{cat.toUpperCase()}</Text>
                        </View>

                        {/* Words List */}
                        <ScrollView style={styles.wordList} showsVerticalScrollIndicator={false}>
                            {words.map((word, wIdx) => (
                                <View key={`word-${wIdx}`} style={styles.wordTag}>
                                    <Text style={styles.lockedWordText}>
                                        {word.toLowerCase()}
                                    </Text>
                                </View>
                            ))}
                            {words.length === 0 && (
                                <Text style={styles.emptyNote}>Empty</Text>
                            )}
                        </ScrollView>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: 140,
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 4,
        paddingTop: 6,
        gap: 6,
    },
    column: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E8E1CF',
        borderBottomWidth: 4,
        borderBottomColor: '#D8D0BC',
        overflow: 'hidden',
    },
    columnSelectable: {
        borderColor: '#FFA114',
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' }
        })
    },
    columnPressed: {
        transform: [{ translateY: 2 }],
        borderBottomWidth: 2,
    },
    columnActive: {
        borderColor: '#6DC328',
        borderWidth: 3,
        borderBottomWidth: 5,
        borderBottomColor: '#4A8D15',
        backgroundColor: '#FCFBF7',
    },
    headerBox: {
        paddingVertical: 7,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderBottomWidth: 3,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
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
    wordList: {
        flex: 1,
        padding: 5,
    },
    wordTag: {
        backgroundColor: '#F3EDE2',
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 4,
        marginBottom: 4,
        alignItems: 'center',
    },
    lockedWordText: {
        color: '#9E927E',
        fontSize: 10,
        fontWeight: '700',
        textDecorationLine: 'line-through',
    },
    emptyNote: {
        color: '#DDD4C4',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 14,
    }
});
