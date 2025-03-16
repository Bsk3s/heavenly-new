import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useBibleBrainAudio } from '../contexts/BibleBrainAudioContext';
import useBibleBrainContent from '../hooks/useBibleBrainContent';
import BibleBrainChapter from '../components/BibleBrainChapter';
import BibleBrainAudioPlayer from '../components/BibleBrainAudioPlayer';
import BibleVersionSelector from '../components/BibleVersionSelector';
import AudioSpeedControls from '../components/AudioSpeedControls';

/**
 * Demo screen for Bible Brain integration
 */
const BibleBrainDemo = () => {
  // Default Bible, book, and chapter
  const defaultBibleId = 'ENGESV';
  const defaultBookId = 'JHN';
  const defaultChapterId = '1';
  
  // Use Bible Brain content hook
  const {
    loading: contentLoading,
    error: contentError,
    content: chapter,
    books,
    availableBibles,
    selectedBible,
    changeBibleVersion,
    loadChapter
  } = useBibleBrainContent(defaultBibleId, defaultBookId, defaultChapterId);
  
  // Use Bible Brain audio context
  const {
    isLoading: audioLoading,
    isPlaying,
    isPaused,
    currentVerseIndex,
    error: audioError,
    progress,
    audioSpeed,
    verseTimings,
    loadAudio,
    play,
    pausePlayback,
    stop,
    seekTo,
    seekToVerse,
    setSpeed
  } = useBibleBrainAudio();
  
  // State for selected audio Bible
  const [selectedAudioBible, setSelectedAudioBible] = useState(null);
  
  // Set initial audio Bible when Bible version changes
  useEffect(() => {
    if (selectedBible && selectedBible.audioBibles?.length > 0) {
      // Use the first available audio Bible
      setSelectedAudioBible(selectedBible.audioBibles[0]);
    }
  }, [selectedBible]);
  
  // Load audio when chapter or audio Bible changes
  useEffect(() => {
    const loadAudioForCurrentChapter = async () => {
      if (
        selectedBible && 
        selectedAudioBible && 
        chapter && 
        !audioLoading
      ) {
        await loadAudio(
          selectedBible.id,
          selectedAudioBible.id,
          chapter.bookId,
          chapter.chapterId
        );
      }
    };
    
    loadAudioForCurrentChapter();
  }, [
    selectedBible, 
    selectedAudioBible, 
    chapter, 
    loadAudio
  ]);
  
  // Handle verse press
  const handleVersePress = (verseNumber) => {
    seekToVerse(verseNumber);
  };
  
  // Handle Bible version change
  const handleBibleVersionChange = (bible) => {
    changeBibleVersion(bible.id);
  };
  
  // Combined loading state
  const isLoading = contentLoading || audioLoading;
  
  // Combined error state
  const error = contentError || audioError;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Bible Brain Demo</Text>
        
        {/* Bible version selector */}
        <BibleVersionSelector
          bibles={availableBibles}
          selectedBible={selectedBible}
          onSelectBible={handleBibleVersionChange}
          style={styles.versionSelector}
        />
      </View>
      
      {/* Chapter content */}
      <View style={styles.content}>
        <BibleBrainChapter
          chapter={chapter}
          isLoading={isLoading}
          error={error}
          currentVerseIndex={currentVerseIndex}
          verseTimings={verseTimings}
          isPlaying={isPlaying}
          onVersePress={handleVersePress}
          autoScroll={true}
        />
      </View>
      
      {/* Audio player */}
      <BibleBrainAudioPlayer
        isPlaying={isPlaying}
        isPaused={isPaused}
        isLoading={audioLoading}
        progress={progress}
        audioSpeed={audioSpeed}
        error={audioError}
        onPlay={play}
        onPause={pausePlayback}
        onStop={stop}
        onSeek={seekTo}
        onSpeedChange={setSpeed}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  versionSelector: {
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
});

export default BibleBrainDemo; 