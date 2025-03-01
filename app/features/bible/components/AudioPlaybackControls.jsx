import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Volume2, SkipBack, SkipForward, Settings } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

const AudioPlaybackControls = ({
  isPlaying,
  isProcessing,
  currentVerseIndex,
  playbackSpeed,
  progress,
  onTogglePlayback,
  onChangeSpeed,
  onJumpToVerse,
  totalVerses
}) => {
  // Format time for display (mm:ss)
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-white border-t border-gray-200 px-4 py-3">
      {/* Progress Bar */}
      <View className="mb-3">
        <Slider
          value={progress.position}
          maximumValue={progress.duration}
          minimumValue={0}
          onSlidingComplete={(value) => {
            const verseIndex = Math.floor((value / progress.duration) * totalVerses);
            onJumpToVerse(verseIndex);
          }}
          minimumTrackTintColor="#4B5563"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#4B5563"
        />
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-500">
            {formatTime(progress.position)}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatTime(progress.duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-between">
        {/* Speed Control */}
        <TouchableOpacity
          onPress={() => {
            const speeds = [0.75, 1, 1.25, 1.5, 2];
            const currentIndex = speeds.indexOf(playbackSpeed);
            const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
            onChangeSpeed(nextSpeed);
          }}
          className="bg-gray-100 rounded-full px-3 py-1"
        >
          <Text className="text-sm font-medium text-gray-900">
            {playbackSpeed}x
          </Text>
        </TouchableOpacity>

        {/* Playback Controls */}
        <View className="flex-row items-center space-x-6">
          <TouchableOpacity
            onPress={() => onJumpToVerse(Math.max(0, currentVerseIndex - 1))}
            className="p-2"
          >
            <SkipBack size={24} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onTogglePlayback}
            disabled={isProcessing}
            className="bg-gray-900 w-12 h-12 rounded-full items-center justify-center"
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Volume2 size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onJumpToVerse(Math.min(totalVerses - 1, currentVerseIndex + 1))}
            className="p-2"
          >
            <SkipForward size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <TouchableOpacity
          onPress={() => {/* TODO: Implement settings modal */ }}
          className="bg-gray-100 rounded-full p-2"
        >
          <Settings size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AudioPlaybackControls; 