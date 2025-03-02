import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { interpolate, useAnimatedStyle, Extrapolate } from 'react-native-reanimated';

const FloatingNavigation = ({ onPrevious, onNext, scrollY }) => {
  const animatedStyle = useAnimatedStyle(() => {
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
        animatedStyle,
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