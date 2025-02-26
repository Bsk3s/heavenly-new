import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function BibleScreen() {
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Content */}
      <View className="flex-1 px-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Bible content will be displayed here</Text>
        </View>
      </View>
    </View>
  );
}
