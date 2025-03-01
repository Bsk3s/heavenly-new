import { useEffect, useCallback, useState } from 'react';
import { Audio } from 'expo-av';

const useAudioPlayer = () => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Initialize audio mode
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true
        });
      } catch (err) {
        setError('Failed to initialize audio mode');
        console.error('Error initializing audio:', err);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
      if (status.error) {
        setError(`Error: ${status.error}`);
      }
    }
  }, []);

  const loadAudio = useCallback(async (audioContent) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioContent}` },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 100,
          positionMillis: 0,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setError(null);
      return newSound;
    } catch (err) {
      setError('Failed to load audio');
      console.error('Error loading audio:', err);
      throw err;
    }
  }, [sound, onPlaybackStatusUpdate]);

  const play = useCallback(async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.playAsync();
        }
      }
    } catch (err) {
      setError('Failed to play audio');
      console.error('Error playing audio:', err);
    }
  }, [sound]);

  const pause = useCallback(async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
        }
      }
    } catch (err) {
      setError('Failed to pause audio');
      console.error('Error pausing audio:', err);
    }
  }, [sound]);

  const stop = useCallback(async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.stopAsync();
          await sound.setPositionAsync(0);
        }
      }
    } catch (err) {
      setError('Failed to stop audio');
      console.error('Error stopping audio:', err);
    }
  }, [sound]);

  const seek = useCallback(async (millis) => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setPositionAsync(millis);
        }
      }
    } catch (err) {
      setError('Failed to seek audio');
      console.error('Error seeking audio:', err);
    }
  }, [sound]);

  const setVolume = useCallback(async (volume) => {
    try {
      if (sound) {
        await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      }
    } catch (err) {
      setError('Failed to set volume');
      console.error('Error setting volume:', err);
    }
  }, [sound]);

  const setRate = useCallback(async (rate) => {
    try {
      if (sound) {
        await sound.setRateAsync(rate, true);
      }
    } catch (err) {
      setError('Failed to set playback rate');
      console.error('Error setting playback rate:', err);
    }
  }, [sound]);

  return {
    sound,
    isPlaying,
    position,
    duration,
    isLoaded,
    error,
    controls: {
      loadAudio,
      play,
      pause,
      stop,
      seek,
      setVolume,
      setRate
    }
  };
};

export default useAudioPlayer; 