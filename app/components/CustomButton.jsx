import React, { useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export default function Button({ 
  onPress, 
  title,
  type = "PRIMARY",
  className = "" 
}) {
  const [isPressed, setIsPressed] = useState(false);

  const getButtonStyle = () => {
    if (type === "PRIMARY") {
      return isPressed ? 'bg-[#2A2A2A]' : 'bg-[#3A3A3A]';
    }
    return 'bg-white';
  };

  const getTextStyle = () => {
    return type === "PRIMARY" ? "text-white" : "text-black";
  };

  return (
    <Pressable 
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={`${getButtonStyle()} h-14 rounded-full flex-row justify-center items-center px-8 w-[90%] relative ${className}`}
    >
      <Text className={`${getTextStyle()} font-bold text-lg`}>
        {title}
      </Text>
      <View className="absolute right-6">
        <ChevronRight 
          size={24} 
          color={type === "PRIMARY" ? "white" : "black"}
          strokeWidth={3}
        />
      </View>
    </Pressable>
  );
} 