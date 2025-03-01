import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BibleHeader = ({
  currentBook,
  currentChapter,
  currentVersion,
  onBookPress,
  onVersionPress,
  onAudioPress,
  onSearchPress,
  onMorePress,
  isPlaying,
  isLoading,
  className
}) => {
  return (
    <View className={`flex-row items-center justify-between px-2 py-2 ${className}`}>
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={onBookPress}
          className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5 mr-1"
        >
          <Text className="text-gray-900 font-medium">
            {currentBook} {currentChapter}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onVersionPress}
          className="bg-gray-100 rounded-full px-3 py-1.5"
        >
          <Text className="text-gray-900 font-medium">
            {currentVersion}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={onAudioPress}
          className="p-2"
          disabled={isLoading}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color="#374151"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSearchPress}
          className="p-2"
        >
          <Ionicons
            name="search"
            size={24}
            color="#374151"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMorePress}
          className="p-2"
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color="#374151"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BibleHeader; 