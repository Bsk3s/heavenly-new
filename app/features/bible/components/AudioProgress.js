import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AudioProgress = ({
  progress,
  duration,
  currentTime,
  isPlaying,
  onSeek,
  onPrevious,
  onNext,
  onPlayPause,
  style,
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${(progress || 0) * 100}%`,
    };
  });

  return (
    <View style={style} className="bg-white border-t border-gray-200">
      <View className="px-4 py-3">
        {/* Progress Bar */}
        <Pressable
          onPress={(event) => {
            const { locationX, width } = event.nativeEvent;
            onSeek(locationX / width);
          }}
          className="mb-2"
        >
          <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <Animated.View
              className="h-full bg-purple-500 rounded-full"
              style={progressBarStyle}
            />
          </View>
        </Pressable>

        <View className="flex-row items-center justify-between">
          {/* Time Display */}
          <View className="flex-row space-x-1">
            <Text className="text-sm text-gray-600">{formatTime(currentTime)}</Text>
            <Text className="text-sm text-gray-400">/</Text>
            <Text className="text-sm text-gray-400">{formatTime(duration)}</Text>
          </View>

          {/* Controls */}
          <View className="flex-row items-center space-x-8">
            <TouchableOpacity onPress={onPrevious} className="p-2">
              <Ionicons name="play-skip-back" size={28} color="#374151" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onPlayPause} className="p-2">
              <Animated.View>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={32}
                  color="#374151"
                />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} className="p-2">
              <Ionicons name="play-skip-forward" size={28} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AudioProgress; 