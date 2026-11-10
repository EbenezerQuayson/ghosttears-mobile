import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';

export default function ActivePlayArea({
    currentFragment,
    pendingLetter,
    onLockIn,
    disabled,
    activeCategory
}) {
    const isLockable = !disabled && Boolean(pendingLetter) && Boolean(activeCategory);

    return (
        <View style={styles.container}>
            {/* Category Plaque Banner */}
            <View style={styles.categoryPlaque}>
                <Text style={styles.categoryPlaqueText}>
                    {activeCategory ? `CATEGORY: ${activeCategory.toUpperCase()}` : 'PICK A CATEGORY ABOVE'}
                </Text>
            </View>

            {/* Main Word Board Plaque */}
            <View style={styles.displayArea}>
                <Text style={styles.fragmentText}>
                    {currentFragment || ''}
                    {pendingLetter ? (
                        <Text style={styles.pendingText}>{pendingLetter}</Text>
                    ) : (
                        <Text style={styles.cursor}>_</Text>
                    )}
                </Text>
            </View>

            {/* Lock In 3D Button */}
            <Pressable
                style={({ pressed }) => [
                    styles.lockButton,
                    isLockable ? styles.lockButtonActive : styles.lockButtonDisabled,
                    pressed && isLockable && styles.lockButtonPressed
                ]}
                disabled={!isLockable}
                onPress={onLockIn}
            >
                <Text style={[
                    styles.lockText,
                    isLockable ? styles.lockTextActive : styles.lockTextDisabled
                ]}>
                    LOCK IN LETTER
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    categoryPlaque: {
        backgroundColor: '#FFA114',
        paddingVertical: 5,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderBottomWidth: 3,
        borderBottomColor: '#D77500',
        marginBottom: 8,
    },
    categoryPlaqueText: {
        color: '#FFFFFF',
        fontSize: 11,
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
    displayArea: {
        width: '100%',
        minHeight: 90,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#E8E1CF',
        borderBottomWidth: 6,
        borderBottomColor: '#D4CBB4',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    fragmentText: {
        color: '#3B332B',
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: 8,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
        textAlign: 'center',
    },
    pendingText: {
        color: '#FFA114',
        textDecorationLine: 'underline',
    },
    cursor: {
        color: '#C4BDB0',
    },
    lockButton: {
        paddingVertical: 13,
        paddingHorizontal: 36,
        borderRadius: 16,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 180,
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' }
        })
    },
    lockButtonPressed: {
        transform: [{ translateY: 3 }],
        borderBottomWidth: 2,
    },
    lockButtonActive: {
        backgroundColor: '#6DC328',
        borderBottomWidth: 5,
        borderBottomColor: '#4A8D15',
    },
    lockButtonDisabled: {
        backgroundColor: '#EAE4D3',
        borderBottomWidth: 4,
        borderBottomColor: '#D0C9B6',
    },
    lockText: {
        fontWeight: '900',
        fontSize: 15,
        letterSpacing: 1,
    },
    lockTextActive: {
        color: '#FFFFFF',
        ...Platform.select({
            web: { textShadow: '0px 1.5px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 1,
            }
        }),
    },
    lockTextDisabled: {
        color: '#A89E8D',
    }
});
