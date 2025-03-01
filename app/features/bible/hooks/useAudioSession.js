import { useState, useEffect } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

const useAudioSession = () => {
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
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });

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

  // Initialize on mount
  useEffect(() => {
    setupAudioSession();
  }, []);

  return {
    isSessionReady,
    error,
    setupAudioSession
  };
};

export default useAudioSession; 