import { useState, useCallback, useEffect, useRef } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { getGoogleTTS } from '../services/ttsService';

export const useBibleAudio = (verses, { book, chapter }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  const [error, setError] = useState(null);
  
  // Sound management
  const currentSound = useRef(null);
  const nextSound = useRef(null);
  const isLoadingRef = useRef(false);
  const statusListenerRef = useRef(null);
  const isMountedRef = useRef(true);
  const preloadingRef = useRef(false);

  // Initialize audio session
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        });
      } catch (err) {
        console.error('Error initializing audio:', err);
      }
    };
    initAudio();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(async () => {
    try {
      if (statusListenerRef.current && currentSound.current) {
        currentSound.current.setOnPlaybackStatusUpdate(null);
      }
      statusListenerRef.current = null;

      if (currentSound.current) {
        try {
          const status = await currentSound.current.getStatusAsync();
          if (status.isLoaded) {
            await currentSound.current.stopAsync();
            await currentSound.current.unloadAsync();
          }
        } catch (err) {
          console.error('Error cleaning up current sound:', err);
        }
        currentSound.current = null;
      }
      
      if (nextSound.current) {
        try {
          const status = await nextSound.current.getStatusAsync();
          if (status.isLoaded) {
            await nextSound.current.unloadAsync();
          }
        } catch (err) {
          console.error('Error cleaning up next sound:', err);
        }
        nextSound.current = null;
      }

      if (isMountedRef.current) {
        setCurrentVerseIndex(-1);
        setIsPlaying(false);
        setIsProcessing(false);
        setError(null);
      }
    } catch (err) {
      console.error('Error in cleanup:', err);
    }
  }, []);

  const createSound = useCallback(async (verse) => {
    if (!isMountedRef.current) return null;
    
    try {
      // Minimal natural pause
      const verseText = `<speak>${verse.text}<break time="150ms"/></speak>`;
      const audioContent = await getGoogleTTS(verseText);
      if (!isMountedRef.current) return null;

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioContent}` },
        { 
          shouldPlay: false,
          progressUpdateIntervalMillis: 50,
          positionMillis: 0,
          rate: 1.0,
          volume: 1.0,
          shouldCorrectPitch: true,
        }
      );
      return sound;
    } catch (err) {
      console.error('Error creating sound:', err);
      throw err;
    }
  }, []);

  const preloadNextVerse = useCallback(async (currentIndex) => {
    if (!isMountedRef.current || preloadingRef.current || currentIndex >= verses.length - 1 || nextSound.current) return;
    
    try {
      preloadingRef.current = true;
      const nextVerse = verses[currentIndex + 1];
      const sound = await createSound(nextVerse);
      if (sound && isMountedRef.current) {
        nextSound.current = sound;
      }
    } catch (err) {
      console.error('Error preloading next verse:', err);
    } finally {
      preloadingRef.current = false;
    }
  }, [verses, createSound]);

  const handleVerseFinished = useCallback(async (index) => {
    if (!isMountedRef.current) return;
    
    try {
      if (index < verses.length - 1) {
        const nextIndex = index + 1;
        playVerse(nextIndex);
      } else {
        await cleanup();
      }
    } catch (err) {
      console.error('Error handling verse finished:', err);
      await cleanup();
    }
  }, [verses, cleanup, playVerse]);

  const playVerse = useCallback(async (index) => {
    if (!isMountedRef.current || isLoadingRef.current) return;
    if (index < 0 || index >= verses.length) return;

    isLoadingRef.current = true;
    
    try {
      // Only show processing on initial load
      if (index === 0) {
        setIsProcessing(true);
      }
      setError(null);

      // Quick cleanup of current sound
      if (currentSound.current) {
        if (statusListenerRef.current) {
          currentSound.current.setOnPlaybackStatusUpdate(null);
        }
        const status = await currentSound.current.getStatusAsync();
        if (status.isLoaded) {
          await currentSound.current.stopAsync();
          await currentSound.current.unloadAsync();
        }
        currentSound.current = null;
        statusListenerRef.current = null;
      }

      let sound;
      // Use preloaded sound if available
      if (nextSound.current && index === currentVerseIndex + 1) {
        sound = nextSound.current;
        nextSound.current = null;
      } else {
        sound = await createSound(verses[index]);
      }

      if (!sound || !isMountedRef.current) {
        throw new Error('Sound creation failed or component unmounted');
      }

      // Set up status monitoring
      statusListenerRef.current = (status) => {
        if (!status.isLoaded || !isMountedRef.current) return;

        if (status.didJustFinish) {
          handleVerseFinished(index);
        } else if (status.isPlaying && status.durationMillis) {
          const progress = status.positionMillis / status.durationMillis;
          if (progress > 0.6 && !preloadingRef.current) {
            preloadNextVerse(index);
          }
        }
      };

      sound.setOnPlaybackStatusUpdate(statusListenerRef.current);
      currentSound.current = sound;
      await sound.playAsync();
      
      if (isMountedRef.current) {
        setCurrentVerseIndex(index);
        setIsPlaying(true);
        setIsProcessing(false);
      }

      // Start preloading next verse immediately
      if (index < verses.length - 1 && !preloadingRef.current) {
        preloadNextVerse(index);
      }
    } catch (err) {
      console.error('Error playing verse:', err);
      if (isMountedRef.current) {
        setError(err.message);
        setIsProcessing(false);
      }
      await cleanup();
    } finally {
      isLoadingRef.current = false;
    }
  }, [verses, cleanup, createSound, preloadNextVerse, handleVerseFinished, currentVerseIndex]);

  const pausePlayback = useCallback(async () => {
    if (!isMountedRef.current || !currentSound.current) return;
    
    try {
      const status = await currentSound.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await currentSound.current.pauseAsync();
        if (isMountedRef.current) {
          setIsPlaying(false);
        }
      }
    } catch (err) {
      console.error('Error pausing playback:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, []);

  const resumePlayback = useCallback(async () => {
    if (!isMountedRef.current || !currentSound.current) return;
    
    try {
      const status = await currentSound.current.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await currentSound.current.playAsync();
        if (isMountedRef.current) {
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('Error resuming playback:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    try {
      await cleanup();
    } catch (err) {
      console.error('Error stopping playback:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [cleanup]);

  return {
    isPlaying,
    isProcessing,
    currentVerseIndex,
    error,
    playVerse,
    pausePlayback,
    resumePlayback,
    stopPlayback
  };
};