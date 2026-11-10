import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useResponsive from '../hooks/useResponsive';

export default function LatencyIndicator() {
    const { isDesktop } = useResponsive();
    const [ping, setPing] = useState(45);

    useEffect(() => {
        if (!isDesktop) return;
        const interval = setInterval(() => {
            setPing(Math.floor(Math.random() * 20) + 30);
        }, 5000);
        return () => clearInterval(interval);
    }, [isDesktop]);

    if (!isDesktop) return null;

    let dotColor = '#6DC328';
    if (ping > 100) dotColor = '#FFA114';
    if (ping > 200) dotColor = '#FF4757';

    return (
        <View style={styles.container}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.text}>{ping}ms</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E8E1CF',
        borderBottomWidth: 3,
        borderBottomColor: '#D4CBB4',
        zIndex: 100,
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    text: {
        color: '#7C6F5A',
        fontSize: 11,
        fontWeight: '800',
    }
});
