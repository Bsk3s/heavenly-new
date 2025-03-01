import Constants from 'expo-constants';
import { Audio } from 'expo-av';

// API Configuration
export const TTS_API_KEY = Constants.expoConfig.extra.googleTtsApiKey;
export const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Audio Configuration
export const AUDIO_CONFIG = {
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  interruptionModeIOS: 1, // Audio.InterruptionModeIOS.DoNotMix = 1
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  interruptionModeAndroid: 1, // Audio.InterruptionModeAndroid.DoNotMix = 1
  playThroughEarpieceAndroid: false,
};

// TTS Configuration
export const TTS_CONFIG = {
  voice: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-C',
    ssmlGender: 'MALE'
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 0.9,
    pitch: -0.5
  }
};

// Playback Speeds
export const PLAYBACK_SPEEDS = [0.75, 1.0, 1.25, 1.5];

const audioConstants = {
  // ... existing constants ...
};

export default audioConstants; 