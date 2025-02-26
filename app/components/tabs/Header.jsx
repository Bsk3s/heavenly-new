import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const Header = () => {
  const handleMenuPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add menu functionality here
  };

  return (
    <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-200">
      <Text className="text-xl font-semibold text-gray-900">
        Bible App
      </Text>
      <View className="flex-row items-center space-x-4">
        <Text className="text-blue-500 font-medium">
          Premium
        </Text>
        <TouchableOpacity onPress={handleMenuPress}>
          <Menu size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(Header);

