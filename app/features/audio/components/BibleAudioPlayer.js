import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioSession } from '../hooks/useAudioSession';
import { handlePlaybackError } from '../utils/errorHandling';
import { PLAYBACK_SPEEDS } from '../constants/audio';

const BibleAudioPlayer = ({ 
  chapter, 
  bookName, 
  chapterNumber,
  onHighlightVerse 
}) => {
  // State management
  const [state, setState] = useState({
    isPlaying: false,
    isLoading: false,
    currentVerseIndex: 0,
    audioProgress: 0,
    playbackSpeed: 1.0,
    error: null
  });

  // Refs
  const soundObject = useRef(null);
  const progressInterval = useRef(null);

  // Custom hooks
  const { isSessionReady, error: sessionError } = useAudioSession();

  // Basic controls (to be implemented)
  const playAudio = async () => {
    if (!isSessionReady) {
      setState(prev => ({ ...prev, error: 'Audio system not ready' }));
      return;
    }
    // Implementation coming in Phase 2
  };

  const pauseAudio = async () => {
    // Implementation coming in Phase 2
  };

  const skipToVerse = async (verseIndex) => {
    // Implementation coming in Phase 2
  };

  // Render verses with highlighting
  const renderVerses = () => {
    return chapter?.map((verse, index) => (
      <TouchableOpacity 
        key={verse.verseNumber}
        style={[
          styles.verseContainer,
          state.currentVerseIndex === index && state.isPlaying && styles.highlightedVerse
        ]}
        onPress={() => skipToVerse(index)}
      >
        <Text style={styles.verseNumber}>{verse.verseNumber}</Text>
        <Text style={styles.verseText}>{verse.text}</Text>
      </TouchableOpacity>
    ));
  };

  // Error display
  if (sessionError || state.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{sessionError || state.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{bookName} {chapterNumber}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={playAudio}
          disabled={state.isLoading}
        >
          {state.isLoading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <MaterialIcons 
              name={state.isPlaying ? "pause" : "play-arrow"} 
              size={32} 
              color="#fff" 
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Verses */}
      <View style={styles.versesContainer}>
        {renderVerses()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#3498db',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playButton: {
    backgroundColor: '#3498db',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versesContainer: {
    flex: 1,
    padding: 16,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginRight: 8,
    width: 20,
    textAlign: 'right',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    flex: 1,
  },
  highlightedVerse: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 4,
    padding: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default BibleAudioPlayer; 