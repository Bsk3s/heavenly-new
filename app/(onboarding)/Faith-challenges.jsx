import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../components/button';
import ProgressHeader, { STEP_COLORS } from '../components/progress-indicator';

export default function FaithChallengesScreen() {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const MAX_SELECTIONS = 2;

  // Define challenges data
  const challenges = [
    {
      id: 1,
      emoji: '⏳',
      description: 'Finding time to read the Bible consistently',
    },
    {
      id: 2,
      emoji: '😕',
      description: 'Understanding scripture in a way that applies to my life',
    },
    {
      id: 3,
      emoji: '🏡',
      description: 'Lacking a supportive faith-based community',
    },
    {
      id: 4,
      emoji: '💭',
      description: 'Feeling distant from God or struggling to hear His voice',
    },
    {
      id: 5,
      emoji: '📖',
      description: 'Not knowing where to start when studying the Bible',
    },
  ];

  // Selection handlers
  const handleSelect = (challenge) => {
    setSelectedOptions((prev) => {
      const isSelected = prev.some(item => item.id === challenge.id);
      
      if (isSelected) {
        return prev.filter(item => item.id !== challenge.id);
      }
      
      if (prev.length >= MAX_SELECTIONS) {
        Alert.alert('Maximum Selection', 'Please select up to 2 challenges');
        return prev;
      }
      
      return [...prev, challenge];
    });
  };

  const isOptionSelected = (challengeId) => {
    return selectedOptions.some(item => item.id === challengeId);
  };

  // Navigation handlers
  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (selectedOptions.length > 0) {
      router.push('growth'); // Or whatever the next screen is
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Progress bar and back button */}
        <View className="mb-8">
          <ProgressHeader 
            currentStep={5}
            totalSteps={10}
            onBack={handleBack}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Title Section */}
          <Text className="text-2xl font-bold mb-2 leading-8">
            What challenges do you face in deepening your faith?
          </Text>
          <Text className="text-base text-gray-500 mb-4">
            Select up to 2 options
          </Text>

          {/* Selection Counter */}
          <View className="mb-6 px-3 py-1.5 bg-purple-50 rounded-2xl self-start">
            <Text className="text-sm font-medium text-purple-600">
              {selectedOptions.length} of {MAX_SELECTIONS} selected
            </Text>
          </View>

          {/* Challenges List */}
          <View className="gap-3 mb-10">
            {challenges.map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                style={{
                  backgroundColor: isOptionSelected(challenge.id) ? STEP_COLORS[4] : 'white',
                  borderColor: isOptionSelected(challenge.id) ? STEP_COLORS[4] : '#d1d5db',
                  borderWidth: 1,
                }}
                className="flex-row items-center p-4 rounded-2xl"
                onPress={() => handleSelect(challenge)}
              >
                <Text className="text-2xl mr-3">{challenge.emoji}</Text>
                <Text
                  className={`flex-1 text-base leading-6 font-semibold ${
                    isOptionSelected(challenge.id)
                    ? 'text-white'
                    : 'text-neutral-700'
                  }`}
                >
                  {challenge.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View className="mt-auto mb-6 items-center">
          <Button
            onPress={handleContinue}
            title="Continue"
            disabled={selectedOptions.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
