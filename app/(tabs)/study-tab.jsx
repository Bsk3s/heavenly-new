import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function StudyTabScreen() {
  const router = useRouter();
  
  // Redirect to study index
  React.useEffect(() => {
    router.replace('/(tabs)/study/');
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Loading indicator */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Loading study content...</Text>
      </View>
    </SafeAreaView>
  );
} 