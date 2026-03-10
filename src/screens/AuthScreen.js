import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../engine/SupabaseClient';
import * as Haptics from 'expo-haptics';

export default function AuthScreen({ navigation }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && !username)) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill out all fields.' });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // On success, App.js auth listener will automatically reroute
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username // Will be captured by a Postgres trigger if configured, or manually inserted
                        }
                    }
                });

                if (error) throw error;

                Toast.show({ type: 'success', text1: 'Account Created!', text2: 'Welcome to Ghosttears.' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Authentication Error', text2: error.message });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setUsername('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>GHOSTTEARS</Text>

            <View style={styles.formContainer}>
                <Text style={styles.modeText}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>

                {!isLogin && (
                    <TextInput
                        style={styles.input}
                        placeholder="USERNAME"
                        placeholderTextColor="#444"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="EMAIL"
                    placeholderTextColor="#444"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="PASSWORD"
                    placeholderTextColor="#444"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.actionText}>{isLogin ? 'ENTER' : 'CREATE'}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
                    <Text style={styles.toggleText}>
                        {isLogin ? 'NEED AN ACCOUNT? SIGN UP' : 'HAVE AN ACCOUNT? LOGIN'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: '#ff3333',
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: 10,
        marginBottom: 50,
        textAlign: 'center',
    },
    formContainer: {
        width: '80%',
        backgroundColor: '#111',
        padding: 25,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#333',
    },
    modeText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 4,
        marginBottom: 25,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: 15,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#444',
        marginBottom: 15,
        fontSize: 14,
        letterSpacing: 2,
    },
    actionButton: {
        backgroundColor: '#ff3333',
        padding: 15,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10,
    },
    actionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 4,
    },
    toggleButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleText: {
        color: '#888',
        fontSize: 12,
        letterSpacing: 1,
        textDecorationLine: 'underline',
    }
});
