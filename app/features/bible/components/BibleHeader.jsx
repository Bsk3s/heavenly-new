import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDownIcon, Volume2Icon, SearchIcon, MoreHorizontalIcon } from 'lucide-react-native';

export default function BibleHeader({
  currentBook,
  currentChapter,
  currentVersion,
  onBookPress,
  onVersionPress,
  onAudioPress,
  onSearchPress,
  onMorePress,
  isPlaying,
  isLoading
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity 
          onPress={onBookPress}
          className="bg-gray-100 rounded-full px-4 py-2"
        >
          <Text className="text-gray-900 text-lg font-semibold">
            {currentBook} {currentChapter}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onVersionPress}
          className="bg-gray-100 rounded-full px-4 py-2"
        >
          <Text className="text-gray-900 text-lg">{currentVersion}</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center space-x-4">
        <TouchableOpacity onPress={onAudioPress}>
          <Volume2Icon size={24} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onSearchPress}>
          <SearchIcon size={24} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onMorePress}>
          <MoreHorizontalIcon size={24} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
} 