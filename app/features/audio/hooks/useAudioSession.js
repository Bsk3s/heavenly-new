import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { AUDIO_CONFIG } from '../constants/audio';

export const useAudioSession = () => {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [error, setError] = useState(null);

  const setupAudioSession = async () => {
    try {
      console.log('[AudioSession] Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Audio permissions not granted');
      }

      console.log('[AudioSession] Setting audio mode...');
      await Audio.setAudioModeAsync(AUDIO_CONFIG);
      
      console.log('[AudioSession] Setup complete');
      setIsSessionReady(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('[AudioSession] Setup failed:', err);
      setError(`Failed to initialize audio: ${err.message}`);
      setIsSessionReady(false);
      return false;
    }
  };

  const cleanupAudioSession = async () => {
    try {
      console.log('[AudioSession] Cleaning up...');
      await Audio.setAudioModeAsync({
        ...AUDIO_CONFIG,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
      });
      setIsSessionReady(false);
    } catch (err) {
      console.error('[AudioSession] Cleanup failed:', err);
    }
  };

  // Initialize on mount
  useEffect(() => {
    setupAudioSession();
    return () => {
      cleanupAudioSession();
    };
  }, []);

  return {
    isSessionReady,
    error,
    setupAudioSession,
    cleanupAudioSession
  };
}; 