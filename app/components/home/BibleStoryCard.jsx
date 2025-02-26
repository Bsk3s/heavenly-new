import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

const BibleStoryCard = ({ title, description, imageSrc }) => (
  <View className="flex-shrink-0 w-72 bg-white rounded-xl overflow-hidden shadow-sm">
    <Image source={{ uri: imageSrc }} className="w-full h-40 object-cover" />
    <View className="p-4">
      <Text className="font-medium text-gray-800">{title}</Text>
      <Text className="text-sm text-gray-500 mt-1">{description}</Text>
      <View className="flex flex-row gap-2 mt-3">
        <TouchableOpacity className="flex-1 py-1.5 bg-blue-50 rounded-lg">
          <Text className="text-sm font-medium text-blue-600 text-center">Read</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 py-1.5 bg-gray-50 rounded-lg">
          <Text className="text-sm font-medium text-gray-600 text-center">Listen</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default BibleStoryCard; 