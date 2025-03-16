import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleBrainService from '../services/bibleBrainService';

/**
 * Custom hook for managing Bible audio playback from Bible Brain API
 * @param {string} bibleId - Bible version ID
 * @param {string} audioBibleId - Audio Bible ID
 * @param {string} bookId - Book ID (e.g., 'GEN', 'MAT')
 * @param {string|number} chapterId - Chapter number
 * @param {Array} verses - Array of verses for highlighting
 * @returns {Object} Audio playback state and controls
 */
export default function useBibleBrainAudio(bibleId, audioBibleId, bookId, chapterId, verses = []) {
  // Audio playback state
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  const [progress, setProgress] = useState({
    position: 0,
    duration: 0,
    percentage: 0
  });
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [verseTimings, setVerseTimings] = useState([]);
  const [audioInfo, setAudioInfo] = useState(null);

  // Refs
  const soundRef = useRef(null);
  const statusUpdateIntervalRef = useRef(null);
  const isLoadingRef = useRef(false);
  const lastPositionRef = useRef(0);
  const lastChapterRef = useRef(null);

  // Initialize audio session
  useEffect(() => {
    const setupAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
        setAudioError('Failed to initialize audio system');
      }
    };

    setupAudioSession();

    // Cleanup audio session on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(err => 
          console.error('Error unloading sound:', err)
        );
      }
      
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
      }
    };
  }, []);

  // Load audio when chapter changes
  useEffect(() => {
    const loadAudioForChapter = async () => {
      // Skip if already loading or if parameters are missing
      if (isLoadingRef.current || !bibleId || !audioBibleId || !bookId || !chapterId) {
        return;
      }

      // Skip if chapter hasn't changed
      const chapterKey = `${bibleId}_${audioBibleId}_${bookId}_${chapterId}`;
      if (lastChapterRef.current === chapterKey) {
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        setAudioError(null);
        
        // Unload previous audio if exists
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        
        // Clear previous interval
        if (statusUpdateIntervalRef.current) {
          clearInterval(statusUpdateIntervalRef.current);
          statusUpdateIntervalRef.current = null;
        }
        
        // Reset state
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentVerseIndex(-1);
        setProgress({
          position: 0,
          duration: 0,
          percentage: 0
        });
        
        // Fetch audio information
        const audioData = await bibleBrainService.getChapterAudio(
          bibleId, 
          audioBibleId, 
          bookId, 
          chapterId
        );
        
        setAudioInfo(audioData);
        
        // Fetch verse timings
        const timings = await bibleBrainService.getVerseTimings(
          audioBibleId,
          bookId,
          chapterId
        );
        
        setVerseTimings(timings);
        
        // Load audio
        const { sound } = await bibleBrainService.loadAudio(audioData.url);
        soundRef.current = sound;
        
        // Get initial status
        const status = await sound.getStatusAsync();
        
        // Update progress
        setProgress({
          position: status.positionMillis / 1000,
          duration: status.durationMillis / 1000,
          percentage: status.durationMillis > 0 
            ? (status.positionMillis / status.durationMillis) * 100 
            : 0
        });
        
        // Set up status update interval
        statusUpdateIntervalRef.current = setInterval(updatePlaybackStatus, 500);
        
        // Update chapter reference
        lastChapterRef.current = chapterKey;
        
        // Save last played chapter
        await AsyncStorage.setItem('bibleBrain_lastPlayed', JSON.stringify({
          bibleId,
          audioBibleId,
          bookId,
          chapterId,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error loading audio:', error);
        setAudioError(`Failed to load audio: ${error.message}`);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    };

    loadAudioForChapter();
  }, [bibleId, audioBibleId, bookId, chapterId]);

  // Update playback status
  const updatePlaybackStatus = async () => {
    if (!soundRef.current) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      
      if (!status.isLoaded) return;
      
      // Update playback state
      setIsPlaying(status.isPlaying);
      
      // Update progress
      const position = status.positionMillis / 1000;
      const duration = status.durationMillis / 1000;
      const percentage = duration > 0 ? (position / duration) * 100 : 0;
      
      setProgress({
        position,
        duration,
        percentage
      });
      
      // Update current verse based on position
      if (verseTimings.length > 0) {
        const currentTime = position;
        let foundVerseIndex = -1;
        
        for (let i = 0; i < verseTimings.length; i++) {
          const timing = verseTimings[i];
          const nextTiming = verseTimings[i + 1];
          
          const start = timing.startTime;
          const end = nextTiming ? nextTiming.startTime : duration;
          
          if (currentTime >= start && currentTime < end) {
            foundVerseIndex = i;
            break;
          }
        }
        
        if (foundVerseIndex !== -1 && foundVerseIndex !== currentVerseIndex) {
          setCurrentVerseIndex(foundVerseIndex);
        }
      }
      
      // Check if playback has ended
      if (status.didJustFinish) {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentVerseIndex(-1);
        
        // Reset position
        await soundRef.current.setPositionAsync(0);
      }
      
      // Save position for seeking
      lastPositionRef.current = status.positionMillis;
    } catch (error) {
      console.error('Error updating playback status:', error);
    }
  };

  // Play audio
  const play = useCallback(async () => {
    if (!soundRef.current) {
      setAudioError('Audio not loaded yet');
      return;
    }
    
    try {
      setAudioError(null);
      
      // If paused, resume playback
      if (isPaused) {
        await soundRef.current.playAsync();
        setIsPaused(false);
        setIsPlaying(true);
        return;
      }
      
      // Set playback speed
      await soundRef.current.setRateAsync(audioSpeed, true);
      
      // Start playback
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioError(`Failed to play audio: ${error.message}`);
    }
  }, [isPaused, audioSpeed]);

  // Pause audio
  const pause = useCallback(async () => {
    if (!soundRef.current || !isPlaying) return;
    
    try {
      await soundRef.current.pauseAsync();
      setIsPaused(true);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }, [isPlaying]);

  // Stop audio
  const stop = useCallback(async () => {
    if (!soundRef.current) return;
    
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentVerseIndex(-1);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, []);

  // Seek to position
  const seekTo = useCallback(async (seconds) => {
    if (!soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(seconds * 1000);
      
      // Update verse index based on new position
      if (verseTimings.length > 0) {
        let foundVerseIndex = -1;
        
        for (let i = 0; i < verseTimings.length; i++) {
          const timing = verseTimings[i];
          const nextTiming = verseTimings[i + 1];
          
          const start = timing.startTime;
          const end = nextTiming ? nextTiming.startTime : progress.duration;
          
          if (seconds >= start && seconds < end) {
            foundVerseIndex = i;
            break;
          }
        }
        
        if (foundVerseIndex !== -1) {
          setCurrentVerseIndex(foundVerseIndex);
        }
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  }, [verseTimings, progress.duration]);

  // Seek to verse
  const seekToVerse = useCallback(async (verseNumber) => {
    if (!soundRef.current || verseTimings.length === 0) return;
    
    try {
      // Find verse timing
      const verseTiming = verseTimings.find(timing => 
        timing.verseNumber === verseNumber
      );
      
      if (!verseTiming) {
        console.warn(`No timing data for verse ${verseNumber}`);
        return;
      }
      
      // Seek to verse start time
      await soundRef.current.setPositionAsync(verseTiming.startTime * 1000);
      
      // Update verse index
      const verseIndex = verseTimings.findIndex(timing => 
        timing.verseNumber === verseNumber
      );
      
      if (verseIndex !== -1) {
        setCurrentVerseIndex(verseIndex);
      }
      
      // Start playback if not already playing
      if (!isPlaying) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error seeking to verse:', error);
    }
  }, [verseTimings, isPlaying]);

  // Set playback speed
  const setSpeed = useCallback(async (speed) => {
    if (!soundRef.current) return;
    
    try {
      // Valid speeds: 0.75, 1.0, 1.25, 1.5, 2.0
      const validSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];
      const newSpeed = validSpeeds.includes(speed) ? speed : 1.0;
      
      await soundRef.current.setRateAsync(newSpeed, true);
      setAudioSpeed(newSpeed);
      
      // Save preference
      await AsyncStorage.setItem('bibleBrain_audioSpeed', newSpeed.toString());
    } catch (error) {
      console.error('Error setting playback speed:', error);
    }
  }, []);

  // Load saved playback speed on mount
  useEffect(() => {
    const loadSavedSpeed = async () => {
      try {
        const savedSpeed = await AsyncStorage.getItem('bibleBrain_audioSpeed');
        
        if (savedSpeed) {
          const speed = parseFloat(savedSpeed);
          setAudioSpeed(speed);
          
          // Apply to current sound if loaded
          if (soundRef.current) {
            await soundRef.current.setRateAsync(speed, true);
          }
        }
      } catch (error) {
        console.error('Error loading saved playback speed:', error);
      }
    };
    
    loadSavedSpeed();
  }, []);

  return {
    isLoading,
    isPlaying,
    isPaused,
    audioError,
    currentVerseIndex,
    progress,
    audioSpeed,
    verseTimings,
    audioInfo,
    play,
    pause,
    stop,
    seekTo,
    seekToVerse,
    setSpeed
  };
} 