import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import bibleBrainService from '../services/bibleBrainService';

// Create context
const BibleBrainAudioContext = createContext();

/**
 * Provider for audio playback using Bible Brain API
 */
export const BibleBrainAudioProvider = ({ children }) => {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState({ checked: false, available: false });
  const [progress, setProgress] = useState({
    position: 0,
    duration: 0,
    percentage: 0
  });
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [audioInfo, setAudioInfo] = useState(null);
  const [verseTimings, setVerseTimings] = useState([]);
  
  // Refs
  const soundRef = useRef(null);
  const statusUpdateIntervalRef = useRef(null);
  const isLoadingRef = useRef(false);
  
  // Check API connectivity on component mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const status = await bibleBrainService.testAPIConnection();
        setApiStatus({ checked: true, available: status.success });
        
        if (!status.success) {
          console.log('Bible Brain API not available:', status.message);
        }
      } catch (error) {
        console.error('Error checking API connection:', error);
        setApiStatus({ checked: true, available: false });
      }
    };
    
    checkApiConnection();
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
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
  
  /**
   * Load audio for a specific chapter
   */
  const loadAudio = useCallback(async (bibleId, audioBibleId, bookId, chapterId) => {
    // Skip if already loading or if parameters are missing
    if (isLoadingRef.current || !bibleId || !audioBibleId || !bookId || !chapterId) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
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
      
      // Check API availability
      if (!apiStatus.available) {
        const status = await bibleBrainService.testAPIConnection();
        
        if (!status.success) {
          throw new Error('Bible Brain API is not available. Please check your internet connection.');
        }
        
        setApiStatus({ checked: true, available: status.success });
      }
      
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
      
      return true;
    } catch (error) {
      console.error('Error loading audio:', error);
      setError(`Failed to load audio: ${error.message}`);
      return false;
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [apiStatus.available]);
  
  /**
   * Update playback status
   */
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
    } catch (error) {
      console.error('Error updating playback status:', error);
    }
  };
  
  /**
   * Play audio
   */
  const play = useCallback(async () => {
    if (!soundRef.current) {
      setError('Audio not loaded yet');
      return false;
    }
    
    try {
      setError(null);
      
      // Check API availability
      if (!apiStatus.checked) {
        const status = await bibleBrainService.testAPIConnection();
        setApiStatus({ checked: true, available: status.success });
        
        if (!status.success) {
          throw new Error('Bible Brain API is not available. Please check your internet connection.');
        }
      }
      
      // If paused, resume playback
      if (isPaused) {
        await soundRef.current.playAsync();
        setIsPaused(false);
        setIsPlaying(true);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      
      return true;
    } catch (error) {
      console.error('Error playing audio:', error);
      setError(`Failed to play audio: ${error.message}`);
      return false;
    }
  }, [isPaused, apiStatus.checked]);
  
  /**
   * Pause playback
   */
  const pausePlayback = useCallback(async () => {
    if (!soundRef.current) {
      setError('Audio not loaded yet');
      return false;
    }
    
    try {
      setError(null);
      await soundRef.current.pauseAsync();
      setIsPaused(true);
      setIsPlaying(false);
      return true;
    } catch (error) {
      console.error('Error pausing audio:', error);
      setError(`Failed to pause audio: ${error.message}`);
      return false;
    }
  }, []);
  
  /**
   * Stop audio
   */
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
      // Don't show user-facing error for stop
    }
  }, []);
  
  /**
   * Seek to position
   */
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
      // Don't show user-facing error for seek
    }
  }, [verseTimings, progress.duration]);
  
  /**
   * Seek to verse
   */
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
      // Don't show user-facing error for seek to verse
    }
  }, [verseTimings, isPlaying]);
  
  /**
   * Set playback speed
   */
  const setSpeed = useCallback(async (speed) => {
    if (!soundRef.current) return;
    
    try {
      // Valid speeds: 0.75, 1.0, 1.25, 1.5, 2.0
      const validSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];
      const newSpeed = validSpeeds.includes(speed) ? speed : 1.0;
      
      await soundRef.current.setRateAsync(newSpeed, true);
      setAudioSpeed(newSpeed);
    } catch (error) {
      console.error('Error setting playback speed:', error);
      // Don't show user-facing error for speed change
    }
  }, []);
  
  // Context value
  const value = {
    isPlaying,
    isPaused,
    isLoading,
    currentVerseIndex,
    error,
    apiStatus,
    progress,
    audioSpeed,
    audioInfo,
    verseTimings,
    loadAudio,
    play,
    pausePlayback,
    stop,
    seekTo,
    seekToVerse,
    setSpeed,
    clearError: () => setError(null)
  };
  
  return (
    <BibleBrainAudioContext.Provider value={value}>
      {children}
    </BibleBrainAudioContext.Provider>
  );
};

/**
 * Hook to use the Bible Brain audio context
 */
export const useBibleBrainAudio = () => {
  const context = useContext(BibleBrainAudioContext);
  
  if (!context) {
    throw new Error('useBibleBrainAudio must be used within a BibleBrainAudioProvider');
  }
  
  return context;
};

export default BibleBrainAudioContext; 