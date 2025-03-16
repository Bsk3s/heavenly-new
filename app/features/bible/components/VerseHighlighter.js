import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

/**
 * Verse equality checker to prevent unnecessary re-renders
 */
function arePropsEqual(prevProps, nextProps) {
  // Only re-render if these props actually changed
  return (
    prevProps.isCurrentVerse === nextProps.isCurrentVerse &&
    prevProps.isReadVerse === nextProps.isReadVerse &&
    prevProps.verseIndex === nextProps.verseIndex &&
    prevProps.verse.id === nextProps.verse.id &&
    (prevProps.isCurrentVerse === nextProps.isCurrentVerse ? 
      prevProps.currentPosition === nextProps.currentPosition : true)
  );
}

/**
 * VerseHighlighter renders a verse with dynamic highlighting based on playback state
 */
const VerseHighlighter = ({
  verse,
  verseIndex,
  isCurrentVerse,
  isReadVerse,
  currentPosition,
  verseTimestamp,
  onLayout,
  onPress,
}) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue('transparent');

  useEffect(() => {
    if (isCurrentVerse) {
      // Highlight the current verse
      backgroundColor.value = withTiming('rgba(59, 130, 246, 0.1)', {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      // Subtle pulse animation
      scale.value = withTiming(1.02, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      // Return to normal after a delay
      scale.value = withDelay(
        300,
        withTiming(1, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
    } else {
      // Reset to normal state
      backgroundColor.value = withTiming('transparent', {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      scale.value = withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [isCurrentVerse]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: backgroundColor.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      onLayout={(e) => onLayout && onLayout(e, verseIndex)}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress && onPress(verse.id, verseIndex)}
        style={styles.touchable}
      >
        <View style={styles.verseContainer}>
          <Text style={styles.verseNumber}>{verse.number}</Text>
          <Text style={styles.verseText}>{verse.text}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  touchable: {
    paddingVertical: 4,
  },
  verseContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    marginRight: 8,
    minWidth: 20,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    flex: 1,
  },
});

export default VerseHighlighter; 