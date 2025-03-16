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

export default function BibleVersionScreen() {
  const router = useRouter();
  const [selectedVersion, setSelectedVersion] = useState(null);

  const bibleVersions = [
    { id: 1, name: 'New International Version (NIV)' },
    { id: 2, name: 'New King James (NKJV)' },
    { id: 3, name: 'Revised Standard Version Catholic (RSVC)' },
    { id: 4, name: 'Amplified (AMP)' },
    { id: 5, name: 'New American standard Bible' },
    { id: 6, name: 'La Parola è Vita' },
    { id: 7, name: 'Nueva Version Internacional' },
    { id: 8, name: 'La Bible du Semeur' },
    { id: 9, name: 'Noua Traducere Românească' },
    { id: 10, name: 'Ang Salita ng Dios (Tagalog Contemporary Bible)' },
    { id: 11, name: 'Het Boek' },
    { id: 12, name: 'King James Version (KJV)' },
    { id: 13, name: 'World Messianic Bible' },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (selectedVersion) {
      router.push('Spiritual-journey');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        <View className="mb-8">
          <ProgressHeader 
            currentStep={3} 
            totalSteps={10} 
            onBack={handleBack}
          />
        </View>

        <Text className="text-2xl font-bold mb-2">
          What is your preferred Bible version?
        </Text>
        <Text className="text-base text-gray-500 mb-8">
          Select one option
        </Text>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap" style={{ margin: -4 }}>
            {bibleVersions.map((version) => (
              <View key={version.id} className="p-1">
                <TouchableOpacity
                  style={{
                    backgroundColor: selectedVersion?.id === version.id ? STEP_COLORS[3] : 'white',
                    borderColor: selectedVersion?.id === version.id ? STEP_COLORS[3] : '#d1d5db',
                    borderWidth: 1,
                  }}
                  className="rounded-full py-2 px-3"
                  onPress={() => setSelectedVersion(version)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedVersion?.id === version.id
                      ? 'text-white'
                      : 'text-neutral-700'
                    }`}
                  >
                    {version.name}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <View className="mt-auto mb-6 items-center">
          <Button
            onPress={handleContinue}
            title="Continue"
            disabled={!selectedVersion}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
