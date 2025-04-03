// Polyfills MUST be first - no other imports before these
import 'react-native-get-random-values';
import 'react-native-url-polyfill';

// Now other imports
import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Re-enable LiveKitProvider
import LiveKitProvider from './components/livekit/LiveKitProvider';

// Debug helper to log all global object properties that might be used by LiveKit
function logGlobalObjects() {
  console.log('⚙️ Environment Check:');
  console.log('Platform:', Platform.OS, Platform.Version);
  console.log('crypto available:', typeof global.crypto !== 'undefined');
  console.log('URL available:', typeof global.URL !== 'undefined');
  console.log('TextEncoder available:', typeof global.TextEncoder !== 'undefined');
  console.log('WebSocket available:', typeof global.WebSocket !== 'undefined');
}

// Root Layout with LiveKitProvider
export default function RootLayout() {
  const [error, setError] = useState(null);

  // Run once to log environment status
  useEffect(() => {
    try {
      console.log('🚀 App starting - environment check:');
      logGlobalObjects();
      console.log('✅ Environment check complete');
    } catch (err) {
      console.error('❌ Error during environment check:', err);
      setError(err.message);
    }
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          Failed to initialize: {error}
        </Text>
      </View>
    );
  }

  // Wrap the Stack in LiveKitProvider
  return (
    <SafeAreaProvider>
      <LiveKitProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </LiveKitProvider>
    </SafeAreaProvider>
  );
} 