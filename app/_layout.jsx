// Polyfills MUST be first - no other imports before these
import 'react-native-get-random-values';
import 'react-native-url-polyfill';

// Now other imports
import React, { useState, useEffect } from 'react';
import { View, Text, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Re-enable LiveKitProvider
import LiveKitProvider from './components/livekit/LiveKitProvider';
// Import AuthProvider
import AuthProvider from '@src/auth/context';
import { handleAuthCallback } from '@src/auth/services/social-auth';
import { supabase } from '@src/auth/supabase-client';

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
function RootLayout() {
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(true);

  useEffect(() => {
    // Run environment check
    console.log('🚀 App starting - environment check:');
    logGlobalObjects();
    console.log('✅ Environment check complete');
  }, []);

  useEffect(() => {
    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      console.log('🔗 Deep link received while app running:', url);
      if (url.includes('auth/callback')) {
        console.log('🔐 Processing auth callback from deep link');
        try {
          const result = await handleAuthCallback(url);
          console.log('📱 Auth callback result:', JSON.stringify(result, null, 2));
          
          // Refresh the auth state if callback was successful
          if (result.success) {
            console.log('✅ Auth callback successful, refreshing session');
            // The session should already be updated by the auth state listener
            // Just get the current session to confirm
            const { data } = await supabase.auth.getSession();
            console.log('Session after callback:', data?.session ? 'exists' : 'null');
          }
        } catch (error) {
          console.error('❌ Error processing auth callback:', error);
        }
      }
    });
    
    // Handle deep links that launched the app
    const getInitialLink = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          console.log('🚀 App opened with URL:', url);
          if (url.includes('auth/callback')) {
            console.log('🔐 Processing auth callback from initial URL');
            try {
              const result = await handleAuthCallback(url);
              console.log('📱 Auth callback result:', JSON.stringify(result, null, 2));
              
              // Refresh the auth state if callback was successful
              if (result.success) {
                console.log('✅ Initial Auth callback successful, refreshing session');
                // The session should already be updated by the auth state listener
                // Just get the current session to confirm
                const { data } = await supabase.auth.getSession();
                console.log('Session after initial callback:', data?.session ? 'exists' : 'null');
              }
            } catch (error) {
              console.error('❌ Error processing initial URL callback:', error);
            }
          }
        } else {
          console.log('📱 App opened normally without deep link');
        }
      } catch (err) {
        console.error('❌ Error getting initial URL:', err);
      }
    };
    
    getInitialLink();

    return () => subscription.remove();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error initializing app: {error.message}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing app...</Text>
      </View>
    );
  }

  // Wrap the Stack in LiveKitProvider and AuthProvider
  return (
    <SafeAreaProvider>
      <LiveKitProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </AuthProvider>
      </LiveKitProvider>
    </SafeAreaProvider>
  );
}

export default RootLayout; 