import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRotatingText } from "./hooks/useRotatingText";
import { useTypingText } from "./hooks/useTypingText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import Button from "./components/button";
import SignInSlider from "./components/sign-in-slider";
import SignUpSlider from "./components/Sign-up-slider";

export default function Index() {
  const { text, textColor } = useRotatingText();
  const { displayedText } = useTypingText("Use Heavenly Hub to", 35);
  const router = useRouter();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      
      if (isAuthenticated === 'true') {
        if (onboardingCompleted === 'true') {
          // TEMPORARY: Direct navigation to tabs for testing
          router.replace('(tabs)');
          // ORIGINAL: Uncomment this and remove the above line when ready
          // router.replace('(home)/home');
        } else {
          router.replace('/(onboarding)/onboarding-layout');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleGetStarted = () => {
    // TEMPORARY: Direct navigation to tabs for testing
    router.push('(tabs)');
    // ORIGINAL: Uncomment this and remove the above line when ready
    // setIsSignUpOpen(true);
  };

  const handleLogin = () => {
    setIsSignInOpen(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
      
      <View className="absolute bottom-2 left-0 right-0 pb-4">
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

      <View className="absolute bottom-0 left-0 right-0">
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
} 