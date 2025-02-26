import { useState, useEffect } from 'react';

const rotatingTexts = [
  { text: "find purpose and direction", textColor: "#df5050" },
  { text: "solve life challenges", textColor: "#4CAF50" },
  { text: "use AI to transform your walk", textColor: "#9C27B0" },
  { text: "start guided conversations", textColor: "#4CAF50" },
  { text: "find answers based on your life situation", textColor: "#673AB7" },
  { text: "get fresh perspective from the word", textColor: "#FF9800" }
];

export function useRotatingText() {
  const [currentText, setCurrentText] = useState(rotatingTexts[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prev => {
        const currentIndex = rotatingTexts.findIndex(t => t.text === prev.text);
        const nextIndex = (currentIndex + 1) % rotatingTexts.length;
        return rotatingTexts[nextIndex];
      });
    }, 2000); // Increased interval to 3 seconds

    return () => clearInterval(interval);
  }, []);

  return { 
    text: currentText?.text || rotatingTexts[0].text, 
    textColor: currentText?.textColor || rotatingTexts[0].textColor 
  };
} 