import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Button from '../components/button';
import ProgressHeader, { STEP_COLORS } from '../components/progress-indicator';
import { useRouter } from 'expo-router';

export default function DenominationScreen() {
  const router = useRouter();
  const [selectedDenomination, setSelectedDenomination] = useState(null);
  const [isPressed, setIsPressed] = useState(false);

  const denominations = [
    { id: 1, label: 'Non - Denominational' },
    { id: 2, label: 'Catholic' },
    { id: 3, label: 'Protestant' },
    { id: 4, label: 'Baptist' },
    { id: 5, label: 'Methodist' },
    { id: 6, label: 'Pentecostal' },
    { id: 7, label: 'Lutheran' },
    { id: 8, label: 'Evangelical' },
    { id: 9, label: 'Orthodox' },
    { id: 10, label: 'Other' },
  ];

  const handleDenominationSelect = (denomination) => {
    setSelectedDenomination(denomination);
  };

  const handleContinue = () => {
    if (selectedDenomination) {
      router.push('age');
    }
  };

  const handleBack = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        <View className="mb-8">
          <ProgressHeader 
            currentStep={1} 
            totalSteps={10}
            onBack={handleBack}
          />
        </View>

        <Text className="text-2xl font-bold mb-2">
          What is your religious background?
        </Text>
        <Text className="text-base text-gray-600 mb-6">
          This could be multiple options, whichever is closest to what you identify with
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-8">
          {denominations.map((denomination) => (
            <TouchableOpacity
              key={denomination.id}
              style={{
                backgroundColor: selectedDenomination?.id === denomination.id ? STEP_COLORS[1] : 'white',
                borderColor: selectedDenomination?.id === denomination.id ? STEP_COLORS[1] : '#d1d5db',
              }}
              className="px-4 py-3 rounded-full border"
              onPress={() => handleDenominationSelect(denomination)}
            >
              <Text
                className={`text-base font-semibold ${
                  selectedDenomination?.id === denomination.id
                  ? 'text-white'
                  : 'text-neutral-700'
                }`}
              >
                {denomination.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-auto mb-6 items-center">
          <Button
            onPress={handleContinue}
            title="Continue"
            disabled={!selectedDenomination}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
