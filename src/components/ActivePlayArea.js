import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ActivePlayArea({
    currentFragment,
    pendingLetter,
    onLockIn,
    disabled,
    activeCategory
}) {
    return (
        <View style={styles.container}>
            <View style={styles.displayArea}>
                <Text style={styles.fragmentText}>
                    {currentFragment}
                    {pendingLetter ? (
                        <Text style={styles.pendingText}>{pendingLetter}</Text>
                    ) : (
                        <Text style={styles.cursor}>_</Text>
                    )}
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.lockButton,
                    (disabled || !pendingLetter || !activeCategory) && styles.lockButtonDisabled
                ]}
                disabled={disabled || !pendingLetter || !activeCategory}
                onPress={onLockIn}
            >
                <Text style={[
                    styles.lockText,
                    (disabled || !pendingLetter || !activeCategory) && styles.lockTextDisabled
                ]}>
                    LOCK IN
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    displayArea: {
        padding: 20,
        minHeight: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fragmentText: {
        color: '#ffffff',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 8,
    },
    pendingText: {
        color: '#ff3333',
    },
    cursor: {
        color: '#ffaa00',
        opacity: 0.5,
    },
    lockButton: {
        backgroundColor: '#ff3333',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 4,
        marginTop: 20,
    },
    lockButtonDisabled: {
        backgroundColor: '#1a0000',
        borderWidth: 1,
        borderColor: '#330000',
    },
    lockText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 2,
    },
    lockTextDisabled: {
        color: '#666666',
    }
});
