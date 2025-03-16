import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ScrollView, Animated, StyleSheet, View, Text } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

/**
 * SmartScrollView provides intelligent scrolling behavior including:
 * - Predictive auto-scrolling during audio playback
 * - User interaction detection and override
 * - Smooth animations for scrolling
 */
const SmartScrollView = forwardRef(({
  children,
  autoScrollEnabled = true,
  currentVerseIndex = -1,
  isPlaying = false,
  verseRefs = {},
  onUserInteractionChange,
  contentContainerStyle,
  style,
  onScroll,
  ...props
}, ref) => {
  // Refs
  const scrollViewRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const isUserInteracting = useRef(false);
  const userInteractionTimeout = useRef(null);
  const lastScrollPosition = useRef(0);
  const targetScrollPosition = useRef(null);
  const scrollAnimation = useRef(null);
  
  // State for UI feedback
  const [showScrollPausedIndicator, setShowScrollPausedIndicator] = useState(false);
  
  // Track previous values to avoid unnecessary updates
  const prevVerseIndexRef = useRef(currentVerseIndex);
  
  // Set up ref imperative handle
  useImperativeHandle(ref, () => ({
    scrollTo: (options) => scrollViewRef.current?.scrollTo(options),
    scrollToVerse: (verseIndex, animate = true) => {
      scrollToVerse(verseIndex, animate);
    },
    getScrollPosition: () => lastScrollPosition.current
  }), [scrollToVerse]);
  
  // Handle user scroll interaction
  const handleScrollBegin = useCallback(() => {
    // Cancel any ongoing scroll animation
    if (scrollAnimation.current) {
      scrollAnimation.current.stop();
      scrollAnimation.current = null;
    }
    
    // Mark as user interacting
    if (!isUserInteracting.current) {
      isUserInteracting.current = true;
      
      if (onUserInteractionChange) {
        onUserInteractionChange(true);
      }
      
      // Show the indicator that auto-scroll is paused
      if (isPlaying && autoScrollEnabled) {
        setShowScrollPausedIndicator(true);
      }
    }
    
    // Clear any existing timeout
    if (userInteractionTimeout.current) {
      clearTimeout(userInteractionTimeout.current);
    }
  }, [isPlaying, autoScrollEnabled, onUserInteractionChange]);
  
  // Handle user scroll end
  const handleScrollEnd = useCallback(() => {
    // Clear any existing timeout
    if (userInteractionTimeout.current) {
      clearTimeout(userInteractionTimeout.current);
    }
    
    // Set timeout to resume auto-scrolling
    userInteractionTimeout.current = setTimeout(() => {
      isUserInteracting.current = false;
      setShowScrollPausedIndicator(false);
      
      if (onUserInteractionChange) {
        onUserInteractionChange(false);
      }
      
      // If still playing, scroll to current verse
      if (isPlaying && autoScrollEnabled && currentVerseIndex >= 0) {
        scrollToVerse(currentVerseIndex);
      }
      
      userInteractionTimeout.current = null;
    }, 3000); // 3 second delay before resuming auto-scroll
  }, [currentVerseIndex, isPlaying, autoScrollEnabled, onUserInteractionChange, scrollToVerse]);
  
  // Handle scroll events
  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { 
        useNativeDriver: true,
        listener: (event) => {
          lastScrollPosition.current = event.nativeEvent.contentOffset.y;
          
          // Call the original onScroll if provided
          if (onScroll) {
            onScroll(event);
          }
        }
      }
    ),
    [scrollY, onScroll]
  );
  
  // Function to scroll to a specific verse
  const scrollToVerse = useCallback((verseIndex, animate = true) => {
    // Skip if user is interacting or auto-scroll is disabled
    if (isUserInteracting.current || !autoScrollEnabled) return;
    
    // Skip if verseIndex is invalid
    if (verseIndex < 0) return;
    
    // Get reference to the verse element
    const verseRef = verseRefs[verseIndex];
    if (!verseRef) return;
    
    // We need to call measureLayout to get the verse position
    verseRef.measureLayout(
      scrollViewRef.current?._component || scrollViewRef.current,
      (x, y, width, height) => {
        // Calculate target position (position verse 1/4 down from the top)
        const scrollViewHeight = 400; // Default height if we can't determine it
        const targetPosition = Math.max(0, y - scrollViewHeight * 0.25);
        
        // Store target position for use in animation
        targetScrollPosition.current = targetPosition;
        
        // Cancel any existing animation
        if (scrollAnimation.current) {
          scrollAnimation.current.stop();
        }
        
        if (animate) {
          // Create and start a spring animation for smooth scrolling
          scrollAnimation.current = Animated.spring(scrollY, {
            toValue: targetPosition,
            useNativeDriver: true,
            tension: 50,
            friction: 10
          });
          
          // Start the animation
          scrollAnimation.current.start(() => {
            scrollAnimation.current = null;
          });
          
          // Also update the underlying ScrollView for consistent state
          scrollViewRef.current?.scrollTo({
            y: targetPosition,
            animated: false
          });
        } else {
          // Immediate scroll without animation
          scrollViewRef.current?.scrollTo({
            y: targetPosition,
            animated: false
          });
          scrollY.setValue(targetPosition);
        }
      },
      () => console.warn('Failed to measure verse layout')
    );
  }, [autoScrollEnabled, scrollY, verseRefs]);
  
  // Auto-scroll to current verse when it changes
  useEffect(() => {
    // Only scroll if the verse index actually changed to avoid unnecessary scrolls
    if (currentVerseIndex >= 0 && 
        isPlaying && 
        autoScrollEnabled && 
        !isUserInteracting.current && 
        currentVerseIndex !== prevVerseIndexRef.current) {
      
      scrollToVerse(currentVerseIndex);
      prevVerseIndexRef.current = currentVerseIndex;
    }
  }, [currentVerseIndex, isPlaying, autoScrollEnabled, scrollToVerse]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (userInteractionTimeout.current) {
        clearTimeout(userInteractionTimeout.current);
      }
      if (scrollAnimation.current) {
        scrollAnimation.current.stop();
      }
    };
  }, []);
  
  // Set up scroll view with pan gesture handler
  return (
    <View style={[styles.container, style]}>
      <Animated.ScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={contentContainerStyle}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        {...props}
      >
        {children}
      </Animated.ScrollView>
      
      {/* Auto-scroll paused indicator */}
      {showScrollPausedIndicator && (
        <Animated.View 
          style={[
            styles.scrollPausedIndicator,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0.7],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Text style={styles.scrollPausedText}>Auto-scroll paused</Text>
          <Text style={styles.scrollPausedSubtext}>Resuming in 3s</Text>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  scrollPausedIndicator: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center'
  },
  scrollPausedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  scrollPausedSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2
  }
});

export default SmartScrollView; 