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
        padding: 30,
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#252243',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3B3663',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        width: '90%',
    },
    fragmentText: {
        color: '#ffffff',
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: 10,
    },
    pendingText: {
        color: '#FFC107',
    },
    cursor: {
        color: '#2DD4BF',
        opacity: 0.6,
    },
    lockButton: {
        backgroundColor: '#2DD4BF',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 20,
        marginTop: 30,
        shadowColor: '#2DD4BF',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    lockButtonDisabled: {
        backgroundColor: '#252243',
        borderWidth: 1,
        borderColor: '#3B3663',
        shadowOpacity: 0,
        elevation: 0,
    },
    lockText: {
        color: '#18152E',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 2,
    },
    lockTextDisabled: {
        color: '#666666',
    }
});
