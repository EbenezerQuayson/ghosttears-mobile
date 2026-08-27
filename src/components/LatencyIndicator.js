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

    let color = '#2DD4BF'; // good
    if (ping > 100) color = '#FFC107'; // warning
    if (ping > 200) color = '#FF3333'; // bad

    return (
        <View style={styles.container}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.text}>{ping} ms</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252243',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 100,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    text: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
