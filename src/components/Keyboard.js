import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';

const KEYS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

export default function Keyboard({ onKeyPress, disabled }) {
    return (
        <View style={styles.container}>
            {KEYS.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                    {row.map((key) => (
                        <Pressable
                            key={key}
                            style={({ hovered, pressed }) => [
                                styles.key,
                                key === '⌫' && { flex: 1.5, maxWidth: 75 },
                                disabled && styles.disabledKey,
                                hovered && !disabled && styles.hoveredKey,
                                pressed && !disabled && styles.pressedKey,
                                // Web cursor support
                                Platform.OS === 'web' && { cursor: disabled ? 'not-allowed' : 'pointer' }
                            ]}
                            onPress={() => onKeyPress(key)}
                            disabled={disabled}
                        >
                            {({ hovered }) => (
                                <Text style={[
                                    styles.keyText, 
                                    disabled && styles.disabledKeyText,
                                    hovered && !disabled && styles.hoveredKeyText,
                                    key === '⌫' && { fontSize: 24 } // Slightly larger icon for backspace
                                ]}>
                                    {key}
                                </Text>
                            )}
                        </Pressable>
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        paddingBottom: 20,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
    },
    key: {
        flex: 1,
        maxWidth: 45,
        height: 50,
        backgroundColor: '#252243',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 3,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#3B3663',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    hoveredKey: {
        backgroundColor: '#3b3663',
        borderColor: '#2DD4BF',
        ...Platform.select({
            web: {
                boxShadow: '0px 0px 15px rgba(45, 212, 191, 0.4)',
                transform: 'translateY(-2px)'
            }
        })
    },
    pressedKey: {
        backgroundColor: '#18152E',
        borderColor: '#2DD4BF',
    },
    keyText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
    },
    hoveredKeyText: {
        color: '#2DD4BF',
    },
    disabledKey: {
        backgroundColor: '#18152E',
        borderColor: '#1f1b36',
        shadowOpacity: 0,
        elevation: 0,
    },
    disabledKeyText: {
        color: '#4b4b5c',
    }
});
