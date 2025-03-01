import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from 'lucide-react-native';

/**
 * Navigation controls component for the Bible reader
 */
export default function NavigationControls({
  onPrevious,
  onNext,
  onPlayPause,
  isPlaying,
  isProcessing
}) {
  return (
    <View className="flex-row items-center justify-between bg-neutral-800/80 rounded-full px-4 py-2">
      <TouchableOpacity
        onPress={onPrevious}
        className="w-12 h-12 items-center justify-center"
      >
        <ChevronLeftIcon size={28} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPlayPause}
        disabled={isProcessing}
        className={`w-16 h-16 items-center justify-center rounded-full ${
          isProcessing ? 'bg-neutral-700' : 'bg-white'
        }`}
      >
        {isPlaying ? (
          <PauseIcon size={32} color="black" />
        ) : (
          <PlayIcon size={32} color="black" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        className="w-12 h-12 items-center justify-center"
      >
        <ChevronRightIcon size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
} 