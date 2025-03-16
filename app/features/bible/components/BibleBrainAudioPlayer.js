import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AudioSpeedControls from './AudioSpeedControls';

/**
 * Format seconds to mm:ss format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time
 */
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Bible Brain Audio Player Component
 * @param {Object} props - Component props
 * @param {boolean} props.isPlaying - Whether audio is currently playing
 * @param {boolean} props.isPaused - Whether audio is paused
 * @param {boolean} props.isLoading - Whether audio is loading
 * @param {Object} props.progress - Audio progress information
 * @param {number} props.audioSpeed - Current playback speed
 * @param {string} props.error - Error message if any
 * @param {Function} props.onPlay - Play callback
 * @param {Function} props.onPause - Pause callback
 * @param {Function} props.onStop - Stop callback
 * @param {Function} props.onSeek - Seek callback
 * @param {Function} props.onSpeedChange - Speed change callback
 * @param {Object} props.style - Additional styles
 */
const BibleBrainAudioPlayer = ({
  isPlaying = false,
  isPaused = false,
  isLoading = false,
  progress = { position: 0, duration: 0, percentage: 0 },
  audioSpeed = 1.0,
  error = null,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
  style
}) => {
  // Local state for slider
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  
  // Update slider when progress changes
  useEffect(() => {
    if (!isSeeking && progress.duration > 0) {
      setSliderValue(progress.position);
    }
  }, [progress, isSeeking]);
  
  // Handle slider change
  const handleSliderChange = (value) => {
    setIsSeeking(true);
    setSliderValue(value);
  };
  
  // Handle slider release
  const handleSliderComplete = (value) => {
    setIsSeeking(false);
    if (onSeek) {
      onSeek(value);
    }
  };
  
  // Toggle speed controls
  const toggleSpeedControls = () => {
    setShowSpeedControls(prev => !prev);
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={progress.duration || 100}
          value={sliderValue}
          minimumTrackTintColor="#3478F6"
          maximumTrackTintColor="#DDDDDD"
          thumbTintColor="#3478F6"
          onValueChange={handleSliderChange}
          onSlidingComplete={handleSliderComplete}
          disabled={isLoading || !progress.duration}
        />
        <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
      </View>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Stop button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onStop}
          disabled={isLoading}
        >
          <Ionicons name="stop" size={24} color={isLoading ? "#AAAAAA" : "#333333"} />
        </TouchableOpacity>
        
        {/* Play/Pause button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? onPause : onPlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#3478F6" />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
        
        {/* Speed button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleSpeedControls}
          disabled={isLoading}
        >
          <Text style={[styles.speedButtonText, isLoading && styles.disabledText]}>
            {audioSpeed}x
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Speed controls */}
      {showSpeedControls && (
        <AudioSpeedControls
          currentSpeed={audioSpeed}
          onSpeedChange={onSpeedChange}
          style={styles.speedControls}
        />
      )}
      
      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
    minWidth: 40,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  controlButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  playButton: {
    padding: 16,
    borderRadius: 32,
    backgroundColor: '#3478F6',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  disabledText: {
    color: '#AAAAAA',
  },
  speedControls: {
    marginTop: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    padding: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
  },
});

export default BibleBrainAudioPlayer; 