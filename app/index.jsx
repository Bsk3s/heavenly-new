import 'react-native-get-random-values';
import 'react-native-url-polyfill';

// Remove the direct reanimated import as it should be initialized properly via babel plugin
import { View, Text, TouchableOpacity, LogBox, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import useRotatingText from "./hooks/useRotatingText";
import useTypingText from "./hooks/useTypingText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import Button from "./components/button";
import SignInSlider from "./components/sign-in-slider";
import SignUpSlider from "./components/Sign-up-slider";
import { Link } from "expo-router";
import { styled } from "nativewind";

// Disable any yellow box warnings for debugging
LogBox.ignoreAllLogs();

export default function Index() {
  const [error, setError] = useState(null);
  
  try {
    const { text, textColor } = useRotatingText();
    const { displayedText } = useTypingText("Use Heavenly Hub to", 35);
    const router = useRouter();
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
      try {
        checkAuthStatus();
      } catch (err) {
        console.error('Error in useEffect:', err);
        setError(err.message);
        Alert.alert('Startup Error', err.message);
      }
    }, []);

    const checkAuthStatus = async () => {
      try {
        const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');

        if (isAuthenticated === 'true') {
          if (onboardingCompleted === 'true') {
            router.replace('(tabs)');
          } else {
            router.replace('/(onboarding)/denomination');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setError(error.message);
        Alert.alert('Auth Check Error', error.message);
      }
    };

    const handleGetStarted = () => {
      router.push('/(onboarding)/denomination');
    };

    const handleLogin = () => {
      setIsSignInOpen(true);
    };

    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar style="dark" />

        {error && (
          <View className="bg-red-500 p-4">
            <Text className="text-white font-bold">Error: {error}</Text>
          </View>
        )}

        {/* Main Content */}
        <View className="flex-1 justify-center items-center">
          <Text className="text-3xl font-bold text-center mb-2">
            {displayedText}
          </Text>
          <Text
            className="text-3xl font-light text-center"
            style={{ color: textColor }}
          >
            {text}
          </Text>
        </View>

        {/* Bottom Buttons */}
        <View
          className="absolute left-0 right-0"
          style={{
            bottom: insets.bottom + 18 // Increased from 16 to 48 to move buttons up
          }}
        >
          <View className="mb-4 items-center">
            <Button
              onPress={handleGetStarted}
              title="Get Started"
            />
          </View>

          <View className="items-center">
            <Button
              onPress={handleLogin}
              title="I already have an account"
            />
          </View>
        </View>

        {/* Sliders */}
        <View
          className="absolute left-0 right-0"
          style={{
            bottom: 0
          }}
        >
          <SignUpSlider
            isOpen={isSignUpOpen}
            onClose={() => setIsSignUpOpen(false)}
          />

          <SignInSlider
            isOpen={isSignInOpen}
            onClose={() => setIsSignInOpen(false)}
          />
        </View>
      </SafeAreaView>
    );
  } catch (err) {
    console.error('Render error:', err);
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <StatusBar style="dark" />
        <View className="bg-red-500 p-4 rounded-lg">
          <Text className="text-white font-bold text-lg">App Error</Text>
          <Text className="text-white mt-2">{err.message}</Text>
        </View>
        <View className="mt-4">
          <Button
            onPress={() => {
              Alert.alert('Error details', err.stack || 'No stack trace available');
            }}
            title="Show Details"
          />
        </View>
      </SafeAreaView>
    );
  }
} 