import React, { useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import BibleBrainVerseItem from './BibleBrainVerseItem';
import BibleBrainVerseHighlighter from './BibleBrainVerseHighlighter';

/**
 * Component for displaying Bible chapter content with verse highlighting
 * @param {Object} props - Component props
 * @param {Object} props.chapter - Chapter data from Bible Brain API
 * @param {boolean} props.isLoading - Whether chapter is loading
 * @param {string} props.error - Error message if any
 * @param {number} props.currentVerseIndex - Index of the currently playing verse
 * @param {Array} props.verseTimings - Array of verse timing data
 * @param {boolean} props.isPlaying - Whether audio is currently playing
 * @param {Function} props.onVersePress - Callback when verse is pressed
 * @param {Function} props.onVerseLongPress - Callback when verse is long-pressed
 * @param {boolean} props.autoScroll - Whether to auto-scroll to the current verse
 */
const BibleBrainChapter = ({
  chapter,
  isLoading,
  error,
  currentVerseIndex,
  verseTimings,
  isPlaying,
  onVersePress,
  onVerseLongPress,
  autoScroll = true
}) => {
  // References
  const scrollViewRef = useRef(null);
  const verseRefs = useRef({});
  
  // Get verse reference
  const getVerseRef = useCallback((key, ref) => {
    verseRefs.current[key] = ref;
  }, []);
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3478F6" />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  // Render empty state
  if (!chapter || !chapter.verses || chapter.verses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No verses available</Text>
      </View>
    );
  }
  
  // Get current verse number from verse timings
  const getCurrentVerseNumber = () => {
    if (
      currentVerseIndex >= 0 && 
      verseTimings && 
      verseTimings.length > currentVerseIndex
    ) {
      return verseTimings[currentVerseIndex].verseNumber;
    }
    return null;
  };
  
  const currentVerseNumber = getCurrentVerseNumber();
  
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Chapter reference */}
        <Text style={styles.reference}>{chapter.reference}</Text>
        
        {/* Verses */}
        {chapter.verses.map((verse) => (
          <BibleBrainVerseItem
            key={`verse-${verse.verseNumber}`}
            verseNumber={verse.verseNumber}
            text={verse.text}
            isHighlighted={verse.verseNumber === currentVerseNumber}
            isPlaying={isPlaying}
            onPress={onVersePress}
            onLongPress={onVerseLongPress}
            getRef={getVerseRef}
          />
        ))}
      </ScrollView>
      
      {/* Verse highlighter for auto-scrolling */}
      <BibleBrainVerseHighlighter
        currentVerseIndex={currentVerseIndex}
        verseTimings={verseTimings}
        scrollViewRef={scrollViewRef}
        verseRefs={verseRefs}
        isPlaying={isPlaying}
        autoScroll={autoScroll}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  reference: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default BibleBrainChapter; 