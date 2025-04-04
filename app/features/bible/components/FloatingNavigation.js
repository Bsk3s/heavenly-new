import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withTiming,
  useAnimatedReaction
} from 'react-native-reanimated';

const FloatingNavigation = ({ onPrevious, onNext, scrollY }) => {
  // We'll only use one shared value for bottom navigation
  const showBottomNav = useSharedValue(1);
  
  // Use scrollY to determine when to show/hide navigation
  useAnimatedReaction(
    () => scrollY.value,
    (currentValue) => {
      // Show navigation by default
      // Hide when in the middle of content (100 < scrollY < 600)
      if (currentValue > 100 && currentValue < 600) {
        showBottomNav.value = withTiming(0, { duration: 200 });
      } else {
        showBottomNav.value = withTiming(1, { duration: 200 });
      }
    }
  );
  
  // Style for the bottom navigation
  const bottomAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: showBottomNav.value,
    };
  });

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
    <Animated.View 
      style={[
        { 
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          height: 80,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          pointerEvents: 'box-none',
          zIndex: 1000,
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
  );
};

export default FloatingNavigation; 