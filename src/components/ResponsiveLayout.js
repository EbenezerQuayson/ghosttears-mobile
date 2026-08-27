import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export default function ResponsiveLayout({ children }) {
    return (
        <View style={styles.ambientBackground}>
            <View style={styles.appContainer}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    ambientBackground: {
        flex: 1,
        backgroundColor: '#0A0815',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                backgroundImage: 'radial-gradient(circle at center, #18152E 0%, #0A0815 100%)',
            }
        })
    },
    appContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: 'transparent',
    }
});
