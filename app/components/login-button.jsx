import { Text, Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';

export default function LoginButton({ 
  onPress,
  title = "I already have an account",
  className = "" 
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable 
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={`${isPressed ? 'bg-[#666666]' : 'bg-[#808080]'} h-14 rounded-full flex-row justify-center items-center px-8 w-[90%] relative ${className}`}
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