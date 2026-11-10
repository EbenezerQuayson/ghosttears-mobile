import React from 'react';
import { StyleSheet, Platform, Image } from 'react-native';

export default function Avatar({ seed, size = 42 }) {
    const uri = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&radius=50&backgroundColor=FFF8EA`;

    if (Platform.OS === 'web') {
        return (
            <img 
                src={uri} 
                alt="Avatar" 
                style={{ 
                    width: size, 
                    height: size, 
                    borderRadius: size / 2, 
                    border: '2px solid #E8E1CF' 
                }} 
            />
        );
    }

    return (
        <Image 
            source={{ uri }} 
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} 
        />
    );
}

const styles = StyleSheet.create({
    avatar: {
        borderWidth: 2,
        borderColor: '#E8E1CF',
    }
});
