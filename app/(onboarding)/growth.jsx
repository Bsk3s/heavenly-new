import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../components/button';
import ProgressHeader, { STEP_COLORS } from '../components/progress-indicator';
import Slider from '@react-native-community/slider';

export default function GrowthScreen() {
  const router = useRouter();
  const [values, setValues] = useState({
    prayer: 5,
    scripture: 5,
    guidance: 5,
    connection: 5,
  });

  // Define aspects data
  const aspects = [
    {
      id: 'prayer',
      title: 'More consistency in prayer?',
      value: values.prayer,
    },
    {
      id: 'scripture',
      title: 'More understanding of scripture?',
      value: values.scripture,
    },
    {
      id: 'guidance',
      title: 'More guidance in applying faith to life?',
      value: values.guidance,
    },
    {
      id: 'connection',
      title: 'Stronger spiritual connection with God?',
      value: values.connection,
    },
  ];

  // Handlers
  const handleSliderChange = (value, id) => {
    setValues(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('prayer-habits');
  };

  const renderSliderLabels = () => (
    <View className="flex-row justify-between px-1.5 -mt-2">
      <Text className="text-xs text-gray-500">1</Text>
      <Text className="text-xs text-gray-500">10</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        {/* Progress bar and back button */}
        <View className="mb-8">
          <ProgressHeader 
            currentStep={6} 
            totalSteps={10} 
            onBack={handleBack}
          />
        </View>

        {/* Title Section */}
        <Text className="text-2xl font-bold mb-2 leading-8">
          If you could have the perfect faith journey, what would it look like?
        </Text>
        <Text className="text-base text-gray-500 mb-8">
          Rate each aspect from 1-10 based on how important it is to you
        </Text>

        {/* Sliders Section */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="gap-6">
            {aspects.map((aspect) => (
              <View key={aspect.id} className="gap-3">
                <Text className="text-base font-medium text-neutral-700">
                  {aspect.title}
                </Text>
                <View className="flex-row items-center gap-4">
                  <View className="flex-1">
                    <Slider
                      style={{ height: 40, width: '100%' }}
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={aspect.value}
                      onValueChange={(value) => handleSliderChange(value, aspect.id)}
                      minimumTrackTintColor={STEP_COLORS[3]}
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor={STEP_COLORS[3]}
                      tapToSeek={true}
                    />
                    {renderSliderLabels()}
                  </View>
                  <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center">
                    <Text className="text-base font-semibold text-purple-600">
                      {aspect.value}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View className="mt-auto mb-6 items-center">
          <Button
            onPress={handleContinue}
            title="Continue"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
