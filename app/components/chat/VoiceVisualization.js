import React from 'react';
import { Animated } from 'react-native';
import { StyledView, StyledAnimated, StyledGradient } from './StyledComponents';

const VoiceVisualization = ({ 
  activeAI, 
  isListening, 
  blobScale, 
  glowOpacity, 
  particles, 
  particleOpacity, 
  particleScale 
}) => {
  return (
    <StyledView 
      className="flex-1 items-center justify-center relative overflow-hidden"
      accessible={true}
      accessibilityLabel={`${activeAI} voice interaction area. ${isListening ? 'Currently listening' : 'Not listening'}`}
    >
      {/* Background Glow */}
      <StyledAnimated 
        className={`absolute w-64 h-64 rounded-full ${
          activeAI === 'adina' 
            ? 'bg-gradient-to-r from-pink-50 to-purple-50' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50'
        }`}
        style={{ opacity: glowOpacity, transform: [{ scale: 1 }] }}
        accessible={false} // Hide from screen readers as it's decorative
      >
        <StyledGradient
          colors={activeAI === 'adina' 
            ? ['#fce7f3', '#f3e8ff'] // pink-100, purple-100
            : ['#dbeafe', '#e0e7ff'] // blue-100, indigo-100
          }
          className="w-full h-full rounded-full"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </StyledAnimated>
      
      {/* Voice Visualization Blob */}
      <StyledView className="relative w-36 h-36">
        {/* Outer Glow */}
        <StyledAnimated 
          className={`absolute inset-0 rounded-full ${
            activeAI === 'adina' 
              ? 'bg-gradient-to-br from-pink-100/40 to-purple-100/40' 
              : 'bg-gradient-to-br from-blue-100/40 to-indigo-100/40'
          }`}
          style={{
            transform: [{ scale: blobScale }]
          }}
          accessible={false} // Hide from screen readers as it's decorative
        >
          <StyledGradient
            colors={activeAI === 'adina' 
              ? ['rgba(249, 168, 212, 0.4)', 'rgba(216, 180, 254, 0.4)'] // pink-300, purple-300 with opacity
              : ['rgba(147, 197, 253, 0.4)', 'rgba(165, 180, 252, 0.4)'] // blue-300, indigo-300 with opacity
            }
            className="w-full h-full rounded-full"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </StyledAnimated>
        
        {/* Main Blob */}
        <StyledAnimated 
          className={`absolute inset-0 rounded-full ${
            activeAI === 'adina' 
              ? 'bg-gradient-to-tr from-pink-100/90 to-purple-100/90' 
              : 'bg-gradient-to-tr from-blue-100/90 to-indigo-100/90'
          }`}
          style={{
            transform: [{ scale: Animated.multiply(blobScale, 0.95) }]
          }}
          accessible={false} // Hide from screen readers as it's decorative
        >
          <StyledGradient
            colors={activeAI === 'adina' 
              ? ['rgba(249, 168, 212, 0.9)', 'rgba(216, 180, 254, 0.9)'] // with opacity
              : ['rgba(147, 197, 253, 0.9)', 'rgba(165, 180, 252, 0.9)'] // with opacity
            }
            className="w-full h-full rounded-full"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Inner Details */}
          <StyledView className="absolute inset-3 bg-gradient-to-br from-white/40 to-transparent rounded-full" />
        </StyledAnimated>

        {/* Floating Particles - only when listening */}
        {isListening && particles.map((particle, i) => (
          <StyledAnimated
            key={i}
            className={`absolute w-1.5 h-1.5 rounded-full ${
              activeAI === 'adina' ? 'bg-pink-200/60' : 'bg-blue-200/60'
            }`}
            style={{
              opacity: particleOpacity[i],
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particleScale[i] }
              ],
              // Positioning at center
              top: '50%',
              left: '50%',
              marginLeft: -3,
              marginTop: -3
            }}
            accessible={false} // Hide from screen readers as it's decorative
          />
        ))}
      </StyledView>
    </StyledView>
  );
};

export default VoiceVisualization; 