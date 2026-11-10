import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ResponsiveLayout({ children }) {
    return (
        <View style={styles.background}>
            <View style={styles.appContainer}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#F6F3E7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#F6F3E7',
    }
});
