import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { useAudioSession } from '../../audio/hooks/useAudioSession';
import { getGoogleTTS } from '../services/ttsService';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const { isSessionReady, error: sessionError, setupAudioSession } = useAudioSession();
  const [sound, setSound] = useState(null);
  const [state, setState] = useState({
    isPlaying: false,
    currentVerse: null,
    error: null,
    playbackRate: 1.0,
    progress: { position: 0, duration: 0 }
  });

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playVerse = useCallback(async (verse) => {
    try {
      if (!isSessionReady) {
        throw new Error('Audio session not ready');
      }

      // Stop any existing playback
      if (sound) {
        await sound.unloadAsync();
      }

      console.log('Getting TTS audio for verse:', verse.text);
      const audioContent = await getGoogleTTS(verse.text);
      
      // Convert audio content to base64 URI
      const audioUri = `data:audio/mp3;base64,${audioContent}`;
      
      console.log('Creating sound object...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true,
          rate: state.playbackRate,
          progressUpdateIntervalMillis: 100
        }
      );

      setSound(newSound);
      setState(current => ({
        ...current,
        isPlaying: true,
        currentVerse: verse,
        error: null
      }));

      // Add status monitoring
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setState(current => ({ ...current, isPlaying: false }));
        } else if (status.isLoaded) {
          setState(current => ({
            ...current,
            progress: {
              position: status.positionMillis,
              duration: status.durationMillis
            }
          }));
        }
      });

    } catch (error) {
      console.error('Playback error:', error);
      setState(current => ({
        ...current,
        isPlaying: false,
        error: error.message
      }));
    }
  }, [isSessionReady, sound, state.playbackRate]);

  const pausePlayback = useCallback(async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setState(current => ({ ...current, isPlaying: false }));
      }
    } catch (error) {
      console.error('Pause error:', error);
      setState(current => ({ ...current, error: error.message }));
    }
  }, [sound]);

  const resumePlayback = useCallback(async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setState(current => ({ ...current, isPlaying: true }));
      }
    } catch (error) {
      console.error('Resume error:', error);
      setState(current => ({ ...current, error: error.message }));
    }
  }, [sound]);

  const stopPlayback = useCallback(async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setState(current => ({
          ...current,
          isPlaying: false,
          currentVerse: null,
          progress: { position: 0, duration: 0 }
        }));
      }
    } catch (error) {
      console.error('Stop error:', error);
      setState(current => ({ ...current, error: error.message }));
    }
  }, [sound]);

  const setPlaybackRate = useCallback(async (rate) => {
    try {
      if (sound) {
        await sound.setRateAsync(rate, true);
        setState(current => ({ ...current, playbackRate: rate }));
      }
    } catch (error) {
      console.error('Rate change error:', error);
      setState(current => ({ ...current, error: error.message }));
    }
  }, [sound]);

  const seekTo = useCallback(async (position) => {
    try {
      if (sound) {
        await sound.setPositionAsync(position);
      }
    } catch (error) {
      console.error('Seek error:', error);
      setState(current => ({ ...current, error: error.message }));
    }
  }, [sound]);

  const value = {
    ...state,
    isSessionReady,
    sessionError,
    setupAudioSession,
    playVerse,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    setPlaybackRate,
    seekTo
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

export default AudioContext; 