import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex flex-row justify-between items-center p-4 bg-white">
        <Text className="text-xl font-semibold">Chat</Text>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Chat content will be displayed here</Text>
      </View>
    </SafeAreaView>
  );
}
