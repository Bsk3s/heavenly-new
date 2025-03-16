import 'react-native-reanimated';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AudioProvider } from './features/bible/contexts/AudioContext';
import { styled } from 'nativewind';

const StyledSafeAreaProvider = styled(SafeAreaProvider);

export default function RootLayout() {
  return (
    <StyledSafeAreaProvider>
      <StatusBar style="dark" />
      <AudioProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AudioProvider>
    </StyledSafeAreaProvider>
  );
} 