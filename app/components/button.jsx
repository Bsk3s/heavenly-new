import { Text, Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';

export default function Button({ 
  onPress, 
  title = "Continue",
  className = "" 
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable 
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={`${isPressed ? 'bg-[#2A2A2A]' : 'bg-[#3A3A3A]'} h-14 rounded-full flex-row justify-center items-center px-8 w-[90%] relative ${className}`}
    >
      <Text className="text-white font-bold text-lg">
        {title}
      </Text>
      <View className="absolute right-6">
        <ChevronRight 
          size={24} 
          color="white"
          strokeWidth={3}
        />
      </View>
    </Pressable>
  );
}