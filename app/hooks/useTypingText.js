import { useState, useEffect } from 'react';
import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

const useTypingText = (text, speed = 50) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    setDisplayedText('');
    setIsComplete(false);

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => text.slice(0, currentIndex + 1));
        // Use Haptics for a more precise, punchy feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(intervalId);
      }
    }, speed);

    return () => {
      clearInterval(intervalId);
    };
  }, [text, speed]);

  return { displayedText: displayedText || text, isComplete };
};

export default useTypingText; 