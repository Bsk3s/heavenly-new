import React, { useEffect } from 'react';
import { TouchableOpacity, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  interpolate, 
  useAnimatedStyle, 
  Extrapolate,
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

const FloatingNavigation = ({ onPrevious, onNext, scrollY, children }) => {
  // Create a shared value to track if we're at the bottom
  const isAtBottom = useSharedValue(false);
  
  // Track the last scroll position and direction
  const lastScrollY = useSharedValue(0);
  const isScrollingDown = useSharedValue(true);
  
  // This style will control visibility based on scroll position at the top
  const topAnimatedStyle = useAnimatedStyle(() => {
    // Show when at the top (scrollY < 20)
    const opacity = interpolate(
      scrollY.value,
      [0, 20],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
    };
  });

  // This style will control visibility based on scroll position at the bottom
  const bottomAnimatedStyle = useAnimatedStyle(() => {
    // We want to show when at the bottom or when scrolling has stopped
    return {
      opacity: isAtBottom.value ? withTiming(1, { duration: 300 }) : withTiming(0, { duration: 300 }),
    };
  });

  // Set up a worklet to detect when scrolling has stopped
  useEffect(() => {
    let scrollTimeout;
    
    // Create a listener for the scrollY shared value
    const scrollListener = scrollY.addListener((value) => {
      // Determine scroll direction
      if (value > lastScrollY.value) {
        isScrollingDown.value = true;
      } else {
        isScrollingDown.value = false;
      }
      
      // Update last scroll position
      lastScrollY.value = value;
      
      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set isAtBottom to false while actively scrolling
      isAtBottom.value = false;
      
      // Set a timeout to detect when scrolling has stopped
      scrollTimeout = setTimeout(() => {
        // When scrolling stops, check if we're near the bottom
        // This is a simplified approach - in a real implementation, you would
        // compare scrollY + viewportHeight with contentHeight
        
        // For now, we'll consider "at bottom" if:
        // 1. We were scrolling down (not up)
        // 2. We've scrolled a significant amount
        if (isScrollingDown.value && value > 300) {
          isAtBottom.value = true;
        }
      }, 200); // Short delay to detect when scrolling stops
    });
    
    // Clean up
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollY.removeListener(scrollListener);
    };
  }, [scrollY]);

  const buttonStyle = {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  };

  return (
    <>
      {/* Top Navigation - Shows at the top of content */}
      <Animated.View 
        style={[
          { 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            paddingBottom: 30,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            pointerEvents: 'box-none',
          },
          topAnimatedStyle,
        ]}
      >
        {/* Left Button */}
        <TouchableOpacity
          onPress={onPrevious}
          style={buttonStyle}
        >
          <Ionicons 
            name="chevron-back-sharp" 
            size={36} 
            color="rgba(0, 0, 0, 0.75)"
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>

        {/* Right Button */}
        <TouchableOpacity
          onPress={onNext}
          style={buttonStyle}
        >
          <Ionicons 
            name="chevron-forward-sharp" 
            size={36} 
            color="rgba(0, 0, 0, 0.75)"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Navigation - Shows when at the bottom of content */}
      <Animated.View 
        style={[
          { 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            paddingBottom: 30,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            pointerEvents: 'box-none',
          },
          bottomAnimatedStyle,
        ]}
      >
        {/* Left Button */}
        <TouchableOpacity
          onPress={onPrevious}
          style={buttonStyle}
        >
          <Ionicons 
            name="chevron-back-sharp" 
            size={36} 
            color="rgba(0, 0, 0, 0.75)"
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>

        {/* Right Button */}
        <TouchableOpacity
          onPress={onNext}
          style={buttonStyle}
        >
          <Ionicons 
            name="chevron-forward-sharp" 
            size={36} 
            color="rgba(0, 0, 0, 0.75)"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

export default FloatingNavigation; 