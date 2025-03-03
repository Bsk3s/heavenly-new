import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform, Vibration } from 'react-native';
import TextToSpeech from '../native/TextToSpeech';

export default function useBibleAudio(verses, reference) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ 
    progress: 0, 
    currentTime: 0, 
    duration: 0,
    verseProgress: 0
  });
  
  const intervalRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const totalDurationRef = useRef(0);

  // Calculate total duration once when verses change
  useEffect(() => {
    if (verses?.length) {
      totalDurationRef.current = verses.reduce((total, verse) => {
        const wordCount = verse.text.split(' ').length;
        return total + (wordCount * 250) + 500;
      }, 0);
    }
  }, [verses]);

  const cleanupSound = useCallback(async () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (isSpeakingRef.current) {
        await TextToSpeech.stop();
        isSpeakingRef.current = false;
      }
      setIsPlaying(false);
      startTimeRef.current = 0;
      pausedTimeRef.current = 0;
    } catch (err) {
      console.error('Error cleaning up sound:', err);
    }
  }, []);

  const updateProgress = useCallback(() => {
    if (!isPlaying || !verses?.length) return;
    
    const currentTime = Date.now() - startTimeRef.current + pausedTimeRef.current;
    const totalProgress = Math.min(currentTime / totalDurationRef.current, 1);
    
    // Calculate which verse we're on and progress within that verse
    let accumulatedTime = 0;
    let currentVerse = 0;
    let verseProgress = 0;
    
    for (let i = 0; i < verses.length; i++) {
      const wordCount = verses[i].text.split(' ').length;
      const verseDuration = (wordCount * 250) + 500;
      
      if (accumulatedTime + verseDuration > currentTime) {
        currentVerse = i;
        verseProgress = (currentTime - accumulatedTime) / verseDuration;
        break;
      }
      accumulatedTime += verseDuration;
    }

    // Only update verse if actually playing
    if (isPlaying && currentVerse !== currentVerseIndex) {
      setCurrentVerseIndex(currentVerse);
    }

    setProgress({
      progress: totalProgress,
      currentTime: currentTime / 1000,
      duration: totalDurationRef.current / 1000,
      verseProgress
    });
  }, [isPlaying, verses, currentVerseIndex]);

  // Start progress tracking
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(updateProgress, 16);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, updateProgress]);

  const playVerse = useCallback(async (verseIndex, startTime = 0) => {
    try {
      if (isProcessing || !verses || !verses[verseIndex]) {
        throw new Error('Invalid verse index');
      }

      setError(null);
      setIsProcessing(true);
      
      await cleanupSound();
      
      const verseText = verses[verseIndex].text;
      
      isSpeakingRef.current = true;
      startTimeRef.current = Date.now() - startTime * 1000;
      pausedTimeRef.current = startTime * 1000;
      
      setIsPlaying(true);
      setCurrentVerseIndex(verseIndex);
      
      await TextToSpeech.speak(verseText);
      
      isSpeakingRef.current = false;
      if (isPlaying) {
        playNextVerse();
      }

      setIsProcessing(false);
    } catch (err) {
      console.error('Error playing verse:', err);
      setError(err.message || 'Failed to play audio');
      Vibration.vibrate(100);
      setIsProcessing(false);
      cleanupSound();
    }
  }, [verses, cleanupSound, isProcessing, playNextVerse, isPlaying]);

  const playNextVerse = useCallback(async () => {
    if (currentVerseIndex < verses.length - 1) {
      playVerse(currentVerseIndex + 1);
    } else {
      await cleanupSound();
      setCurrentVerseIndex(-1);
    }
  }, [currentVerseIndex, verses?.length, cleanupSound, playVerse]);

  const pausePlayback = useCallback(async () => {
    try {
      if (isSpeakingRef.current) {
        await TextToSpeech.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Store the current progress when pausing
      pausedTimeRef.current = Date.now() - startTimeRef.current + pausedTimeRef.current;
      setIsPlaying(false);
    } catch (err) {
      console.error('Error pausing playback:', err);
    }
  }, []);

  const resumePlayback = useCallback(async () => {
    if (currentVerseIndex >= 0) {
      // Resume from current position
      const currentTime = pausedTimeRef.current / 1000;
      await playVerse(currentVerseIndex, currentTime);
    } else if (verses && verses.length > 0) {
      await playVerse(0);
    }
  }, [currentVerseIndex, verses, playVerse]);

  const stopPlayback = useCallback(async () => {
    try {
      await cleanupSound();
      setCurrentVerseIndex(-1);
      setProgress({ progress: 0, currentTime: 0, duration: 0, verseProgress: 0 });
    } catch (err) {
      console.error('Error stopping playback:', err);
    }
  }, [cleanupSound]);

  const seekToPosition = useCallback(async (newProgress) => {
    try {
      if (!verses || verses.length === 0) return;
      
      const newTime = totalDurationRef.current * newProgress;
      
      // Find the verse that contains this time
      let accumulatedTime = 0;
      let targetVerseIndex = 0;
      let startTimeInVerse = 0;
      
      for (let i = 0; i < verses.length; i++) {
        const wordCount = verses[i].text.split(' ').length;
        const verseDuration = (wordCount * 250) + 500;
        
        if (accumulatedTime + verseDuration > newTime) {
          targetVerseIndex = i;
          startTimeInVerse = (newTime - accumulatedTime) / 1000;
          break;
        }
        accumulatedTime += verseDuration;
      }

      // If currently playing, start playing from new position
      if (isPlaying) {
        await playVerse(targetVerseIndex, startTimeInVerse);
      } else {
        // Just update the position without playing
        setCurrentVerseIndex(targetVerseIndex);
        pausedTimeRef.current = newTime;
        setProgress({
          progress: newProgress,
          currentTime: newTime / 1000,
          duration: totalDurationRef.current / 1000,
          verseProgress: startTimeInVerse / (verses[targetVerseIndex].text.split(' ').length * 0.25 + 0.5)
        });
      }
    } catch (err) {
      console.error('Error seeking:', err);
    }
  }, [verses, playVerse, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSound();
    };
  }, [cleanupSound]);

  return {
    isPlaying,
    isProcessing,
    currentVerseIndex,
    error,
    progress,
    playVerse,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    seekToPosition
  };
} 