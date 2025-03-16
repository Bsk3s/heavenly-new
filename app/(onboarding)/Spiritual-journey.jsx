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

export default function SpiritualJourneyScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState(null);

  // Define faith relationship options
  const options = [
    {
      id: 1,
      emoji: '🌱',
      description: "I'm exploring faith and looking for guidance",
    },
    {
      id: 2,
      emoji: '🔍',
      description: 'I believe in God but struggle to stay consistent',
    },
    {
      id: 3,
      emoji: '🙏',
      description: "I'm actively growing in my faith but want deeper understanding",
    },
    {
      id: 4,
      emoji: '🌟',
      description: 'I have a strong faith and want to stay spiritually sharp',
    },
  ];

  // Navigation handlers
  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (selectedOption) {
      router.push('Faith-challenges');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Progress bar and back button */}
        <View className="mb-8">
          <ProgressHeader 
            currentStep={2} 
            totalSteps={4} 
            onBack={handleBack}
          />
        </View>

        {/* Title Section */}
        <Text className="text-2xl font-bold mb-2 leading-8">
          How would you describe your current relationship with God?
        </Text>
        <Text className="text-base text-gray-500 mb-8">
          Select one option
        </Text>

        {/* Options List */}
        <View className="gap-3">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={{
                backgroundColor: selectedOption?.id === option.id ? STEP_COLORS[2] : 'white',
                borderColor: selectedOption?.id === option.id ? STEP_COLORS[2] : '#d1d5db',
                borderWidth: 1,
              }}
              className="flex-row items-center p-4 rounded-2xl"
              onPress={() => setSelectedOption(option)}
            >
              <Text className="text-2xl mr-3">{option.emoji}</Text>
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