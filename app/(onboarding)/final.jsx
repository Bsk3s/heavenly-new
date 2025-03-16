import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../components/button';
import ProgressHeader, { STEP_COLORS } from '../components/progress-indicator';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FinalScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const isValid = name.trim().length > 0 && age.trim().length > 0;

  // Navigation handlers
  const handleBack = () => {
    router.back();
  };

  const handleComplete = async () => {
    if (isValid) {
      try {
        // Save user data if needed
        await AsyncStorage.setItem('userName', name);
        
        // Mark onboarding as completed
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        
        // Navigate to the main app (tabs)
        router.push('/(tabs)');
      } catch (error) {
        console.error('Error completing onboarding:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-4">
          {/* Progress bar and back button */}
          <View className="mb-8">
            <ProgressHeader 
              currentStep={10} 
              totalSteps={10} 
              onBack={handleBack}
            />
          </View>

          {/* Title Section */}
          <Text className="text-3xl font-bold mb-2">
            Finally
          </Text>
          <Text className="text-xl text-gray-500 mb-8">
            A little more about you
          </Text>

          {/* Input Fields */}
          <View className="gap-4">
            <View className="bg-gray-50 rounded-3xl border border-gray-200">
              <TextInput
                className="h-14 px-5 text-base text-neutral-700"
                placeholder="Name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View className="bg-gray-50 rounded-3xl border border-gray-200">
              <TextInput
                className="h-14 px-5 text-base text-neutral-700"
                placeholder="Age"
                placeholderTextColor="#666"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>

          {/* Complete Button */}
          <View className="mt-auto mb-6 items-center">
            <Button
              onPress={handleComplete}
              title="Complete Quiz"
              disabled={!isValid}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
