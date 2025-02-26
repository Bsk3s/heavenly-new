import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const InputBar = () => {
  const [message, setMessage] = useState('');

  const handleMicPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add mic functionality here
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-white border-t border-gray-200"
    >
      <View className="px-4 py-2">
        <View className="flex-row items-center bg-gray-100 rounded-3xl px-4 py-2">
          <TextInput
            className="flex-1 text-base text-gray-800 py-2"
            placeholder="Message"
            placeholderTextColor="#6B7280"
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity 
            onPress={handleMicPress}
            className="ml-2 p-1"
          >
            <Mic size={24} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default React.memo(InputBar);

