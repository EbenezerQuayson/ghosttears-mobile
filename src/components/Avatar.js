import React from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';

export default function Avatar({ seed, size = 50 }) {
    // We use dicebear API. We pin radius, background, etc.
    const uri = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&radius=50&backgroundColor=252243`;

    if (Platform.OS === 'web') {
        return (
            <img 
                src={uri} 
                alt="Avatar" 
                style={{ width: size, height: size, borderRadius: size / 2 }} 
            />
        );
    }

    return (
        <Image 
            source={{ uri }} 
            style={{ width: size, height: size, borderRadius: size / 2 }} 
        />
    );
}
