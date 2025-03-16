import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Component for controlling audio playback speed
 * @param {Object} props - Component props
 * @param {number} props.currentSpeed - Current playback speed
 * @param {Function} props.onSpeedChange - Callback when speed changes
 * @param {Object} props.style - Additional styles for the container
 */
const AudioSpeedControls = ({ currentSpeed = 1.0, onSpeedChange, style }) => {
  // Available speed options
  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];
  
  // Handle speed selection
  const handleSpeedSelect = (speed) => {
    if (onSpeedChange) {
      onSpeedChange(speed);
      
      // Save preference
      AsyncStorage.setItem('bibleBrain_audioSpeed', speed.toString())
        .catch(err => console.error('Error saving speed preference:', err));
    }
  };
  
  // Format speed for display
  const formatSpeed = (speed) => {
    return speed === 1.0 ? '1x' : `${speed}x`;
  };
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Playback Speed:</Text>
      <View style={styles.speedOptions}>
        {speedOptions.map((speed) => (
          <TouchableOpacity
            key={`speed-${speed}`}
            style={[
              styles.speedButton,
              currentSpeed === speed && styles.activeSpeedButton
            ]}
            onPress={() => handleSpeedSelect(speed)}
          >
            <Text 
              style={[
                styles.speedText,
                currentSpeed === speed && styles.activeSpeedText
              ]}
            >
              {formatSpeed(speed)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555',
  },
  speedOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  activeSpeedButton: {
    backgroundColor: '#3478F6',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  activeSpeedText: {
    color: '#fff',
  },
});

export default AudioSpeedControls; 