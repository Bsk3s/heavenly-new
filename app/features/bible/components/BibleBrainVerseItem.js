import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Component for displaying a Bible verse with highlighting during audio playback
 * @param {Object} props - Component props
 * @param {number} props.verseNumber - Verse number
 * @param {string} props.text - Verse text
 * @param {boolean} props.isHighlighted - Whether the verse is currently highlighted
 * @param {boolean} props.isPlaying - Whether audio is currently playing
 * @param {Function} props.onPress - Callback when verse is pressed
 * @param {Function} props.onLongPress - Callback when verse is long-pressed
 * @param {Function} props.onLayout - Callback when verse layout is calculated
 * @param {Function} props.getRef - Callback to get reference to the verse component
 */
const BibleBrainVerseItem = ({
  verseNumber,
  text,
  isHighlighted = false,
  isPlaying = false,
  onPress,
  onLongPress,
  onLayout,
  getRef
}) => {
  // Reference to the verse component
  const verseRef = useRef(null);
  
  // Provide the reference to the parent component
  useEffect(() => {
    if (getRef && verseRef.current) {
      getRef(`verse-${verseNumber}`, verseRef.current);
    }
  }, [getRef, verseNumber]);
  
  return (
    <TouchableOpacity
      ref={verseRef}
      style={[
        styles.container,
        isHighlighted && isPlaying && styles.highlightedContainer
      ]}
      onPress={() => onPress && onPress(verseNumber)}
      onLongPress={() => onLongPress && onLongPress(verseNumber)}
      onLayout={onLayout}
      activeOpacity={0.7}
    >
      <Text style={styles.verseNumber}>{verseNumber}</Text>
      <Text 
        style={[
          styles.verseText,
          isHighlighted && isPlaying && styles.highlightedText
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  highlightedContainer: {
    backgroundColor: 'rgba(52, 120, 246, 0.1)',
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888888',
    marginRight: 8,
    minWidth: 20,
    textAlign: 'right',
    paddingTop: 2,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    flex: 1,
  },
  highlightedText: {
    color: '#3478F6',
  },
});

export default BibleBrainVerseItem;

 