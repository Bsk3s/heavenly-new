import { useRef, useEffect } from 'react';
import { Animated, AccessibilityInfo } from 'react-native';

const useVoiceAnimation = (isListening) => {
  // Animation values
  const blobScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const particles = useRef([
    new Animated.ValueXY({ x: 0, y: 0 }),
    new Animated.ValueXY({ x: 0, y: 0 }),
    new Animated.ValueXY({ x: 0, y: 0 })
  ]).current;
  const particleOpacity = useRef([
    new Animated.Value(0.2),
    new Animated.Value(0.2),
    new Animated.Value(0.2)
  ]).current;
  const particleScale = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;

  // Announce listening state changes for screen readers
  useEffect(() => {
    if (AccessibilityInfo.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(
        isListening ? "Listening started" : "Listening stopped"
      );
    }
  }, [isListening]);

  // Start/Stop animations based on listening state
  useEffect(() => {
    if (isListening) {
      // Scale the blob
      Animated.spring(blobScale, {
        toValue: 1.1,
        friction: 6,
        useNativeDriver: true
      }).start();
      
      // Show the glow
      Animated.timing(glowOpacity, {
        toValue: 0.4,
        duration: 700,
        useNativeDriver: true
      }).start();
      
      // Animate floating particles
      particles.forEach((particle, index) => {
        const randomX = Math.random() * 50 - 25;
        const randomY = -20 - Math.random() * 20;
        
        // Reset position
        particle.setValue({ x: 0, y: 0 });
        particleOpacity[index].setValue(0.2);
        particleScale[index].setValue(1);
        
        // Create animation sequence
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.parallel([
            Animated.timing(particle, {
              toValue: { x: randomX, y: randomY },
              duration: 2500,
              useNativeDriver: true
            }),
            Animated.timing(particleOpacity[index], {
              toValue: 0.8,
              duration: 1250,
              useNativeDriver: true
            }),
            Animated.timing(particleScale[index], {
              toValue: 1.2,
              duration: 1250,
              useNativeDriver: true
            }),
            Animated.timing(particleOpacity[index], {
              toValue: 0.2,
              duration: 1250,
              delay: 1250,
              useNativeDriver: true
            }),
            Animated.timing(particleScale[index], {
              toValue: 1,
              duration: 1250,
              delay: 1250,
              useNativeDriver: true
            })
          ])
        ]).start(() => {
          // Loop animation if still listening
          if (isListening) {
            particles.forEach((particle, idx) => {
              const randomX = Math.random() * 50 - 25;
              const randomY = -20 - Math.random() * 20;
              
              Animated.timing(particle, {
                toValue: { x: randomX, y: randomY },
                duration: 0,
                useNativeDriver: true
              }).start();
            });
          }
        });
      });
    } else {
      // Reset animations
      Animated.spring(blobScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true
      }).start();
      
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true
      }).start();
    }
  }, [isListening]);

  return {
    blobScale,
    glowOpacity,
    particles,
    particleOpacity,
    particleScale
  };
};

export default useVoiceAnimation; 