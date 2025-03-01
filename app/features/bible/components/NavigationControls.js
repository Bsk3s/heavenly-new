import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated, Pressable, Easing, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const NavigationControls = ({
  onPrevious,
  onNext,
  onPlayPause,
  isPlaying,
  isProcessing,
  progress = 0,
  currentTime = 0,
  duration = 0,
  onSeek,
}) => {
  // Animated values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const playScale = useRef(new Animated.Value(1)).current;

  // Update progress animation smoothly
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Format time helper (e.g., 1:23)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = async (event) => {
    const { locationX, pageX } = event.nativeEvent;
    const progressBarWidth = event.nativeEvent.layout.width;
    const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));

    await Haptics.selectionAsync();
    onSeek(newProgress);
  };

  const animatePlayButton = () => {
    Animated.sequence([
      Animated.timing(playScale, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(playScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <BlurView intensity={20} tint="light" style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Time and Progress Display */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime || 0)}</Text>
        <View style={styles.progressBarContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onLayout={(event) => { }}
            onPress={handleSeek}
            style={styles.progressBarTouch}
          >
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(progress || 0) * 100}%` }
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.timeText}>{formatTime(duration || 0)}</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={onPrevious} style={styles.button}>
          <MaterialIcons name="skip-previous" size={32} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
          <MaterialIcons
            name={isProcessing ? 'hourglass-empty' : isPlaying ? 'pause' : 'play-arrow'}
            size={40}
            color="#000"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} style={styles.button}>
          <MaterialIcons name="skip-next" size={32} color="#000" />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    minWidth: 45,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 8,
    height: 30,
    justifyContent: 'center',
  },
  progressBarTouch: {
    height: 30,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6200EE',
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    padding: 8,
  },
  playButton: {
    padding: 8,
    marginHorizontal: 16,
  },
});

export default NavigationControls; 