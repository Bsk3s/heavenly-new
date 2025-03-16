import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../components/button';
import ProgressHeader, { STEP_COLORS } from '../components/progress-indicator';

export default function AgeScreen() {
  const router = useRouter();
  const [selectedAge, setSelectedAge] = useState(null);
  
  // Define age group options
  const ageGroups = [
    { id: 1, label: '13-17' },
    { id: 2, label: '18-24' },
    { id: 3, label: '25-34' },
    { id: 4, label: '35-44' },
    { id: 5, label: '45-54' },
    { id: 6, label: '55+' }
  ];

  // Navigation handlers
  const handleBack = () => {
    router.back();  // Go back to denomination screen
  };

  const handleContinue = () => {
    if (selectedAge) {
      router.push('bible-version');  // Navigate to bible version selection
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Progress bar and back button */}
        <View className="mb-8">
          <ProgressHeader 
            currentStep={2} 
            totalSteps={10} 
            onBack={handleBack}
          />
        </View>

        {/* Screen title and subtitle */}
        <Text className="text-2xl font-bold mb-2">
          What is your age group?
        </Text>

        {/* Age selection buttons */}
        <View className="flex-row flex-wrap gap-2 mb-8">
          {ageGroups.map((age) => (
            <TouchableOpacity
              key={age.id}
              style={{
                backgroundColor: selectedAge?.id === age.id ? STEP_COLORS[2] : 'white',
                borderColor: selectedAge?.id === age.id ? STEP_COLORS[2] : '#d1d5db',
              }}
              className="px-4 py-3 rounded-full border"
              onPress={() => setSelectedAge(age)}
            >
              <Text
                className={`text-base font-semibold ${
                  selectedAge?.id === age.id
                  ? 'text-white'
                  : 'text-neutral-700'
                }`}
              >
                {age.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue button - centered at bottom */}
        <View className="mt-auto mb-6 items-center">
          <Button
            onPress={handleContinue}
            title="Continue"
            disabled={!selectedAge}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
