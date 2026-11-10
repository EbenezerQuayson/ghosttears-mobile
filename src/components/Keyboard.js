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
                    {row.map((key) => {
                        const isBackspace = key === '⌫';
                        return (
                            <Pressable
                                key={key}
                                style={({ pressed }) => [
                                    styles.key,
                                    isBackspace && styles.backspaceKey,
                                    disabled && styles.disabledKey,
                                    pressed && !disabled && styles.pressedKey,
                                    Platform.OS === 'web' && { cursor: disabled ? 'default' : 'pointer' }
                                ]}
                                onPress={() => onKeyPress(key)}
                                disabled={disabled}
                            >
                                <Text style={[
                                    styles.keyText,
                                    isBackspace && styles.backspaceText,
                                    disabled && styles.disabledKeyText
                                ]}>
                                    {key}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 6,
        paddingBottom: 16,
        paddingTop: 8,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
        marginBottom: 6,
    },
    key: {
        flex: 1,
        maxWidth: 44,
        height: 48,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E8E1CF',
        borderBottomWidth: 4,
        borderBottomColor: '#D4CBB4',
        ...Platform.select({
            web: { userSelect: 'none' }
        })
    },
    backspaceKey: {
        flex: 1.4,
        maxWidth: 60,
        backgroundColor: '#FF4757',
        borderColor: '#FF4757',
        borderBottomColor: '#D63031',
    },
    pressedKey: {
        transform: [{ translateY: 2 }],
        borderBottomWidth: 2,
    },
    keyText: {
        color: '#3B332B',
        fontSize: 16,
        fontWeight: '900',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    },
    backspaceText: {
        color: '#FFFFFF',
        fontSize: 18,
    },
    disabledKey: {
        backgroundColor: '#EDE8DC',
        borderColor: '#E2DCCF',
        borderBottomColor: '#D5CEC0',
    },
    disabledKeyText: {
        color: '#BDB4A5',
    }
});
