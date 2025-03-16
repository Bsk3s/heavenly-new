import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../components/button';
import ProgressHeader, { STEP_COLORS } from '../components/progress-indicator';

export default function ShiftScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    {
      id: 'yes',
      emoji: '✅',
      description: 'Yes, I want a structured way to grow spiritually',
    },
    {
      id: 'no',
      emoji: '🛑',
      description: 'No, I prefer to figure it out on my own',
    },
  ];

  // Navigation handlers
  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (selectedOption) {
      router.push('final');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Progress bar and back button */}
        <View className="mb-8">
          <ProgressHeader 
            currentStep={9} 
            totalSteps={10} 
            onBack={handleBack}
          />
        </View>

        {/* Title Section */}
        <Text className="text-base font-semibold text-purple-600 mb-2 uppercase tracking-wide">
          The Shift
        </Text>
        <Text className="text-2xl font-bold mb-2 leading-8">
          Would you like personalized guidance to help you stay consistent and grow in your faith?
        </Text>
        <Text className="text-base text-gray-500 mb-8">
          Select one option
        </Text>

        {/* Options List */}
        <View className="gap-4 px-1">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={{
                backgroundColor: selectedOption?.id === option.id ? STEP_COLORS[7] : 'white',
                borderColor: selectedOption?.id === option.id ? STEP_COLORS[7] : '#d1d5db',
                borderWidth: 1,
              }}
              className="flex-row items-center p-5 rounded-2xl"
              onPress={() => setSelectedOption(option)}
            >
              <Text className="text-2xl mr-4">{option.emoji}</Text>
              <Text
                className={`flex-1 text-base leading-6 font-semibold ${
                  selectedOption?.id === option.id
                  ? 'text-white'
                  : 'text-neutral-700'
                }`}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <View className="mt-auto mb-6 items-center">
          <Button
            onPress={handleContinue}
            title="Continue"
            disabled={!selectedOption}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
