import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const TimeViewSelector = ({ 
  currentView = 'Today',
  onPrevious,
  onNext,
  onViewChange 
}) => {
  const handlePress = async (direction) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === 'prev') onPrevious();
    if (direction === 'next') onNext();
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <TouchableOpacity 
        onPress={() => handlePress('prev')}
        className="p-2"
      >
        <ChevronLeft size={20} color="#4B5563" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={onViewChange}
        className="flex-row items-center space-x-2"
      >
        <Clock size={18} color="#4B5563" />
        <Text className="text-base font-medium text-gray-700">
          {currentView}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => handlePress('next')}
        className="p-2"
      >
        <ChevronRight size={20} color="#4B5563" />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(TimeViewSelector);
