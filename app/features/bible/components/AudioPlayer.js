import React, { useEffect } from 'react';
import { View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTROL_SIZE = 56;
const PROGRESS_HEIGHT = 4;
const HORIZONTAL_PADDING = 20; // or 16 depending on your preference

const AudioPlayer = ({
  isPlaying,
  progress,
  duration,
  currentTime,
  currentVerse,
  totalVerses,
  onSeek,
  onPrevious,
  onNext,
  onPlayPause,
}) => {
  // Animation values
  const controlsOpacity = useSharedValue(0);
  const progressBarOpacity = useSharedValue(0);
  const seekValue = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Show/hide controls based on playback state
  useEffect(() => {
    if (isPlaying) {
      controlsOpacity.value = withSpring(1, { damping: 15 });
      progressBarOpacity.value = withSpring(1, { damping: 15 });
    } else {
      // When paused, start 10s timer before hiding
      const timer = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
        progressBarOpacity.value = withTiming(0, { duration: 500 });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  // Handle seeking gesture
  const seekGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = seekValue.value;
      isDragging.value = true;
      runOnJS(Haptics.selectionAsync)();
    },
    onActive: (event, ctx) => {
      const newValue = Math.max(0, Math.min(1, ctx.startX + event.translationX / SCREEN_WIDTH));
      seekValue.value = newValue;
    },
    onEnd: () => {
      isDragging.value = false;
      runOnJS(onSeek)(seekValue.value);
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Animated styles
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    opacity: progressBarOpacity.value,
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${(isDragging.value ? seekValue.value : progress) * 100}%`,
  }));

  // Show controls when audio state changes
  const showControls = () => {
    controlsOpacity.value = withSpring(1, { damping: 15 });
    progressBarOpacity.value = withSpring(1, { damping: 15 });
  };

  return (
    <View style={{
      position: 'absolute',
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      pointerEvents: 'box-none',
    }}>
      {/* Floating Controls */}
      <Animated.View style={[{
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'box-none',
      }, controlsStyle]}>
        {/* Previous Button */}
        <TouchableOpacity
          pointerEvents="auto"
          onPress={() => {
            onPrevious();
            Haptics.selectionAsync();
          }}
          style={{
            position: 'absolute',
            left: SCREEN_WIDTH * 0.2,
            bottom: SCREEN_HEIGHT * 0.2,
            width: CONTROL_SIZE,
            height: CONTROL_SIZE,
            borderRadius: CONTROL_SIZE / 2,
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="play-skip-back" size={32} color="rgba(0, 0, 0, 0.85)" />
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          pointerEvents="auto"
          onPress={() => {
            onPlayPause();
            Haptics.selectionAsync();
            showControls();
          }}
          style={{
            position: 'absolute',
            bottom: SCREEN_HEIGHT * 0.2,
            width: CONTROL_SIZE + 20,
            height: CONTROL_SIZE + 20,
            borderRadius: (CONTROL_SIZE + 20) / 2,
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={40}
            color="rgba(0, 0, 0, 0.85)"
          />
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          pointerEvents="auto"
          onPress={() => {
            onNext();
            Haptics.selectionAsync();
          }}
          style={{
            position: 'absolute',
            right: SCREEN_WIDTH * 0.2,
            bottom: SCREEN_HEIGHT * 0.2,
            width: CONTROL_SIZE,
            height: CONTROL_SIZE,
            borderRadius: CONTROL_SIZE / 2,
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="play-skip-forward" size={32} color="rgba(0, 0, 0, 0.85)" />
        </TouchableOpacity>
      </Animated.View>

      {/* Progress Bar */}
      <Animated.View style={[{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 24,
        left: 16,
        right: 16,
        height: PROGRESS_HEIGHT,
        backgroundColor: 'rgba(226, 232, 240, 0.8)', // Light blue-gray background
        borderRadius: PROGRESS_HEIGHT / 2,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
      }, progressBarStyle]}>
        <PanGestureHandler onGestureEvent={seekGestureHandler}>
          <Animated.View style={[{
            height: '100%',
            backgroundColor: '#3B82F6', // Bright blue fill
            borderRadius: PROGRESS_HEIGHT / 2,
          }, progressFillStyle]} />
        </PanGestureHandler>
      </Animated.View>
    </View>
  );
};

export default AudioPlayer; 