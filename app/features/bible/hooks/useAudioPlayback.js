import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import ttsService from '../services/ttsService';
import audioService from '../services/audioService';

const useAudioPlayback = (verses, chapterInfo) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const [error, setError] = useState(null);

  // Refs for cleanup and state management
  const progressInterval = useRef(null);
  const verseTimings = useRef([]);

  // Initialize audio session
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        });
      } catch (err) {
        setError('Failed to initialize audio');
      }
    };

    setupAudio();
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Track progress and current verse
  const startProgressTracking = useCallback(() => {
    progressInterval.current = setInterval(async () => {
      const status = await audioService.getProgress();
      if (status) {
        setProgress(status);

        // Update current verse based on position
        const currentTime = status.position;
        const currentVerse = verseTimings.current.findIndex(
          timing => currentTime >= timing.start && currentTime < timing.end
        );

        if (currentVerse !== -1) {
          setCurrentVerseIndex(currentVerse);
        }
      }
    }, 100);
  }, []);

  // Handle playback
  const togglePlayback = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (isPlaying) {
        await audioService.pause();
        setIsPlaying(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      } else {
        await ttsService.togglePlayback(verses, chapterInfo);
        setIsPlaying(true);
        startProgressTracking();
      }
    } catch (err) {
      setError('Playback error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isPlaying, verses, chapterInfo, startProgressTracking]);

  // Handle speed changes
  const changePlaybackSpeed = useCallback(async (speed) => {
    try {
      await audioService.setPlaybackSpeed(speed);
      setPlaybackSpeed(speed);
    } catch (err) {
      setError('Failed to change playback speed');
    }
  }, []);

  // Jump to specific verse
  const jumpToVerse = useCallback(async (verseIndex) => {
    try {
      if (verseIndex >= 0 && verseIndex < verses.length) {
        await ttsService.playFromVerse(verses, chapterInfo, verseIndex);
        setCurrentVerseIndex(verseIndex);
        setIsPlaying(true);
        startProgressTracking();
      }
    } catch (err) {
      setError('Failed to jump to verse');
    }
  }, [verses, chapterInfo, startProgressTracking]);

  return {
    isPlaying,
    isProcessing,
    currentVerseIndex,
    playbackSpeed,
    progress,
    error,
    controls: {
      togglePlayback,
      changePlaybackSpeed,
      jumpToVerse
    }
  };
};

export default useAudioPlayback; 