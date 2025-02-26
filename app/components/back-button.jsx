import React from 'react';
import { TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

const BackButton = ({ onPress, size = 24, color = '#000' }) => {
  return (
    <TouchableOpacity 
      className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ChevronLeft size={size} color={color} />
    </TouchableOpacity>
  );
};

export default BackButton;