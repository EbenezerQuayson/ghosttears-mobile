import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const KEYS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const screenWidth = Dimensions.get('window').width;
const keyWidth = (screenWidth - 40) / 10; // Simple calc for max keys

export default function Keyboard({ onKeyPress, disabled }) {
    const handlePress = (key) => {
        if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onKeyPress(key);
        }
    };

    return (
        <View style={styles.container}>
            {KEYS.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                    {row.map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.key,
                                { width: rowIndex === 1 ? keyWidth * 0.95 : keyWidth },
                                disabled && styles.disabledKey
                            ]}
                            onPress={() => handlePress(key)}
                            disabled={disabled}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.keyText, disabled && styles.disabledKeyText]}>{key}</Text>
                        </TouchableOpacity>
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
        height: 50,
        backgroundColor: '#1f1f1f',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 3,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#333333',
    },
    keyText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledKey: {
        backgroundColor: '#0a0a0a',
        borderColor: '#1a1a1a',
    },
    disabledKeyText: {
        color: '#444444',
    }
});
