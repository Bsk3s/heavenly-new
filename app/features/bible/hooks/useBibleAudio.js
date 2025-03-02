import { useState, useCallback, useEffect, useRef } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { getGoogleTTS } from '../services/ttsService';
import { handleError } from '../utils/errorUtils';

const useBibleAudio = (verses, { book, chapter }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [isChapterReady, setIsChapterReady] = useState(false);

  // Progress tracking state
  const [progress, setProgress] = useState({
    currentTime: 0,
    duration: 0,
    progress: 0
  });

  // Sound management
  const currentSound = useRef(null);
  const nextSound = useRef(null);
  const isLoadingRef = useRef(false);
  const statusListenerRef = useRef(null);
  const isMountedRef = useRef(true);
  const preloadingRef = useRef(false);

  // Chapter audio management
  const chapterAudioRef = useRef({
    sounds: [],              // Array of preloaded sounds
    totalDuration: 0,        // Total chapter duration
    verseStartTimes: [],     // Start time of each verse
    verseDurations: [],      // Duration of each verse
    isInitialized: false     // Whether chapter is ready
  });

  // Initialize chapter audio silently
  const initializeChapter = useCallback(async () => {
    if (!verses.length || chapterAudioRef.current.isInitialized) return;

    try {
      setIsChapterReady(false);
      const sounds = [];
      const verseDurations = [];
      let totalDuration = 0;
      const verseStartTimes = [];

      // Create all verse audio in parallel
      const soundPromises = verses.map(async (verse) => {
        const verseText = `<speak>${verse.text}<break time="150ms"/></speak>`;
        const audioContent = await getGoogleTTS(verseText);
        if (!isMountedRef.current) return null;

        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/mp3;base64,${audioContent}` },
          { shouldPlay: false }
        );

        const status = await sound.getStatusAsync();
        return { sound, duration: status.durationMillis / 1000, verse: verse.number };
      });

      const results = await Promise.all(soundPromises);

      // Process results and calculate timings
      results.forEach((result, index) => {
        if (result && result.sound) {
          sounds[index] = result.sound;
          verseDurations[index] = result.duration;
          verseStartTimes[index] = totalDuration;
          totalDuration += result.duration;
        }
      });

      // Store everything in ref
      chapterAudioRef.current = {
        sounds,
        totalDuration,
        verseStartTimes,
        verseDurations,
        isInitialized: true
      };

      setProgress(prev => ({
        ...prev,
        duration: totalDuration
      }));

      setIsChapterReady(true);
    } catch (err) {
      const handledError = handleError(err);
      console.error('Error initializing chapter:', handledError);
      setError(handledError);
    }
  }, [verses]);

  // Calculate verse index and offset from chapter position
  const getVerseFromPosition = useCallback((position) => {
    const { verseStartTimes, verseDurations } = chapterAudioRef.current;
    let verseIndex = 0;

    for (let i = verseStartTimes.length - 1; i >= 0; i--) {
      if (position >= verseStartTimes[i]) {
        verseIndex = i;
        break;
      }
    }

    const verseOffset = position - verseStartTimes[verseIndex];
    return { verseIndex, offset: verseOffset * 1000 }; // Convert to milliseconds
  }, []);

  const updateProgress = useCallback((status) => {
    if (!status.isLoaded || !isMountedRef.current) return;

    // Calculate chapter-wide progress
    const verseStartTime = chapterAudioRef.current.verseStartTimes[currentVerseIndex] || 0;
    const versePosition = status.positionMillis / 1000; // Convert to seconds
    const chapterPosition = verseStartTime + versePosition;
    
    setProgress({
      currentTime: chapterPosition,
      duration: chapterAudioRef.current.totalDuration,
      progress: chapterPosition / chapterAudioRef.current.totalDuration
    });
  }, [currentVerseIndex]);

  // Modified playVerse to handle seeking better
  const playVerse = useCallback(async (index, startOffset = 0) => {
    if (!isMountedRef.current || !chapterAudioRef.current.isInitialized) return;
    if (index < 0 || index >= verses.length) return;

    try {
      setIsProcessing(true);

      // If we're seeking within the same verse, just seek
      if (index === currentVerseIndex && currentSound.current) {
        const status = await currentSound.current.getStatusAsync();
        if (status.isLoaded) {
          await currentSound.current.setPositionAsync(startOffset);
          await currentSound.current.playAsync();
          setIsPlaying(true);
          setIsProcessing(false);
          return;
        }
      }

      // Otherwise, clean up and play new verse
      await cleanup();

      const sound = chapterAudioRef.current.sounds[index];
      if (!sound) throw new Error('Verse audio not initialized');

      currentSound.current = sound;
      setCurrentVerseIndex(index);

      // Set up status monitoring
      statusListenerRef.current = (status) => {
        if (!status.isLoaded || !isMountedRef.current) return;

        updateProgress(status);

        if (status.didJustFinish) {
          handleVerseFinished(index);
        }
      };

      sound.setOnPlaybackStatusUpdate(statusListenerRef.current);

      // Set position and play
      if (startOffset > 0) {
        await sound.setPositionAsync(startOffset);
      }
      await sound.playAsync();

      setIsPlaying(true);
      setError(null);

    } catch (err) {
      console.error('Error playing verse:', err);
      setError({
        type: 'AUDIO',
        title: 'Playback Error',
        message: 'Failed to play audio. Please try again.',
        action: 'Retry',
        originalError: err
      });
      await cleanup();
    } finally {
      setIsProcessing(false);
    }
  }, [verses, cleanup, updateProgress, handleVerseFinished]);

  // Update the seekToPosition function
  const seekToPosition = useCallback(async (position) => {
    if (!chapterAudioRef.current.isInitialized) return;
    
    try {
      setIsProcessing(true);
      
      // Calculate target time and verse
      const targetTime = position * chapterAudioRef.current.totalDuration;
      const { verseIndex, offset } = getVerseFromPosition(targetTime);
      
      // Update progress immediately for smoother UI
      setProgress(prev => ({
        ...prev,
        currentTime: targetTime,
        progress: position
      }));

      // If we're already on the correct verse, just seek
      if (verseIndex === currentVerseIndex && currentSound.current) {
        const status = await currentSound.current.getStatusAsync();
        if (status.isLoaded) {
          await currentSound.current.setPositionAsync(offset);
          await currentSound.current.playAsync();
          setIsPlaying(true);
          setIsProcessing(false);
          return;
        }
      }
      
      // Otherwise play the new verse
      await playVerse(verseIndex, offset);
    } catch (err) {
      console.error('Error seeking:', err);
      setError({
        type: 'AUDIO',
        title: 'Seeking Error',
        message: 'Failed to seek to position. Please try again.',
        action: 'Retry',
        originalError: err
      });
    } finally {
      setIsProcessing(false);
    }
  }, [getVerseFromPosition, playVerse, currentVerseIndex]);

  // Initialize on mount
  useEffect(() => {
    initializeChapter();
    return () => {
      cleanup();
      // Cleanup preloaded sounds
      chapterAudioRef.current.sounds.forEach(async (sound) => {
        if (sound) {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              await sound.unloadAsync();
            }
          } catch (err) {
            console.error('Error cleaning up preloaded sound:', err);
          }
        }
      });
      chapterAudioRef.current = {
        sounds: [],
        totalDuration: 0,
        verseStartTimes: [],
        verseDurations: [],
        isInitialized: false
      };
    };
  }, [verses, initializeChapter, cleanup]);

  const cleanup = useCallback(async () => {
    try {
      // Remove status listener
      if (statusListenerRef.current && currentSound.current) {
        currentSound.current.setOnPlaybackStatusUpdate(null);
      }
      statusListenerRef.current = null;

      // Cleanup current sound
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
      }

      // Cleanup next sound
      if (nextSound.current) {
        try {
          const status = await nextSound.current.getStatusAsync();
          if (status.isLoaded) {
            await nextSound.current.unloadAsync();
          }
        } catch (err) {
          console.error('Error cleaning up next sound:', err);
        }
      }

      // Reset state if component is still mounted
      if (isMountedRef.current) {
        setCurrentVerseIndex(-1);
        setIsPlaying(false);
        setIsProcessing(false);
        setError(null);
      }
    } catch (err) {
      console.error('Error in cleanup:', err);
    } finally {
      currentSound.current = null;
      nextSound.current = null;
    }
  }, []);

  // Update the handleVerseFinished function
  const handleVerseFinished = useCallback(async (index) => {
    if (!isMountedRef.current) return;

    try {
      if (index < verses.length - 1) {
        const nextIndex = index + 1;
        // Calculate next verse start time
        const nextStartTime = chapterAudioRef.current.verseStartTimes[nextIndex];
        const totalDuration = chapterAudioRef.current.totalDuration;
        
        // Update progress before playing next verse
        setProgress(prev => ({
          ...prev,
          currentTime: nextStartTime,
          progress: nextStartTime / totalDuration
        }));
        
        // Play next verse
        await playVerse(nextIndex);
      } else {
        await cleanup();
      }
    } catch (err) {
      console.error('Error handling verse finished:', err);
      await cleanup();
    }
  }, [verses, cleanup, playVerse]);

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
      const handledError = handleError(err);
      console.error('Error preloading next verse:', handledError);
      if (isMountedRef.current) {
        setError(handledError);
      }
    } finally {
      preloadingRef.current = false;
    }
  }, [verses, createSound]);

  const createSound = useCallback(async (verse) => {
    if (!isMountedRef.current) return null;

    try {
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

      // Get duration for progress tracking
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        progressRef.current.verseDurations[verse.number - 1] = status.durationMillis / 1000;
        progressRef.current.totalDuration = progressRef.current.verseDurations.reduce((a, b) => a + b, 0);

        // Calculate verse start times
        let startTime = 0;
        progressRef.current.verseStartTimes = progressRef.current.verseDurations.map(duration => {
          const time = startTime;
          startTime += duration;
          return time;
        });
      }

      return sound;
    } catch (err) {
      const handledError = handleError(err);
      console.error('Error creating sound:', handledError);
      throw handledError;
    }
  }, []);

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
        const handledError = handleError(err);
        console.error('Error initializing audio:', handledError);
        if (isMountedRef.current) {
          setError(handledError);
        }
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
  }, [cleanup]);

  // Modified pausePlayback to be more robust
  const pausePlayback = useCallback(async () => {
    try {
      if (currentSound.current) {
        const status = await currentSound.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await currentSound.current.pauseAsync();
        }
      }
      setIsPlaying(false);
    } catch (err) {
      console.error('Error pausing playback:', err);
    }
  }, []);

  // Modified resumePlayback to be more robust
  const resumePlayback = useCallback(async () => {
    try {
      if (currentSound.current) {
        const status = await currentSound.current.getStatusAsync();
        if (status.isLoaded) {
          await currentSound.current.playAsync();
          setIsPlaying(true);
          return;
        }
      }
      // If we can't resume, try playing from current position
      await playVerse(currentVerseIndex);
    } catch (err) {
      console.error('Error resuming playback:', err);
      setError({
        type: 'AUDIO',
        title: 'Playback Error',
        message: 'Failed to resume audio. Please try again.',
        action: 'Retry',
        originalError: err
      });
    }
  }, [currentVerseIndex, playVerse]);

  const stopPlayback = useCallback(async () => {
    try {
      await cleanup();
    } catch (err) {
      console.error('Error stopping playback:', err);
    }
  }, [cleanup]);

  return {
    isPlaying,
    isProcessing,
    currentVerseIndex,
    error,
    progress,
    isChapterReady,
    playVerse,
    seekToPosition,
    pausePlayback,
    resumePlayback,
    stopPlayback
  };
};

export default useBibleAudio;