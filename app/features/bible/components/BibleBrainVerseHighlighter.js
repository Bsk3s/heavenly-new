import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

/**
 * Component for highlighting verses during audio playback
 * @param {Object} props - Component props
 * @param {number} props.currentVerseIndex - Index of the currently playing verse
 * @param {Array} props.verseTimings - Array of verse timing data
 * @param {Object} props.scrollViewRef - Reference to the ScrollView containing verses
 * @param {Object} props.verseRefs - References to verse components
 * @param {boolean} props.isPlaying - Whether audio is currently playing
 * @param {boolean} props.autoScroll - Whether to auto-scroll to the current verse
 */
const BibleBrainVerseHighlighter = ({
  currentVerseIndex,
  verseTimings,
  scrollViewRef,
  verseRefs,
  isPlaying,
  autoScroll = true
}) => {
  // Ref to track the last highlighted verse
  const lastHighlightedVerseRef = useRef(-1);
  
  // Scroll to the current verse when it changes
  useEffect(() => {
    if (
      isPlaying &&
      autoScroll &&
      currentVerseIndex >= 0 &&
      currentVerseIndex !== lastHighlightedVerseRef.current &&
      verseTimings &&
      verseTimings.length > currentVerseIndex &&
      scrollViewRef?.current &&
      verseRefs?.current
    ) {
      const verseNumber = verseTimings[currentVerseIndex].verseNumber;
      const verseRef = verseRefs.current[`verse-${verseNumber}`];
      
      if (verseRef) {
        // Measure the position of the verse in the scroll view
        verseRef.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            // Scroll to the verse with some offset
            scrollViewRef.current.scrollTo({
              y: y - 100, // Offset to show some context above the verse
              animated: true
            });
          },
          (error) => {
            console.error('Error measuring verse layout:', error);
          }
        );
      }
      
      // Update the last highlighted verse
      lastHighlightedVerseRef.current = currentVerseIndex;
    }
  }, [currentVerseIndex, isPlaying, autoScroll, verseTimings, scrollViewRef, verseRefs]);
  
  // No visual rendering, this component just handles scrolling
  return null;
};

export default BibleBrainVerseHighlighter; 