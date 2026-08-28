import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ResponsiveLayout from './src/components/ResponsiveLayout';
import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';

const Stack = createNativeStackNavigator();
const NAVIGATION_STATE_KEY = 'GHOSTTEARS_NAVIGATION_STATE';

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState(undefined);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        const state = savedStateString ? JSON.parse(savedStateString) : undefined;
        if (state !== undefined) {
          setInitialState(state);
        }
      } catch (e) {
        console.error('Failed to load navigation state', e);
      } finally {
        setIsReady(true);
      }
    };
    restoreState();
  }, []);

  if (!isReady) {
    return null; 
  }

  return (
    <ResponsiveLayout>
      <NavigationContainer 
        theme={TransparentTheme}
        initialState={initialState}
        onStateChange={(state) => AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state))}
      >
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' }
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="Lobby" component={LobbyScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
      <Toast />
    </ResponsiveLayout>
  );
}