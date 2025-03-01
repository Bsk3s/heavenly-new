import { Audio } from 'expo-av';
import { GOOGLE_TTS_API_KEY } from '@env';
import { AUDIO_CONFIG } from '../../audio/constants/audio';

const GOOGLE_TTS_API = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Clean up text for TTS
function preprocessText(text) {
  return text
    // Remove verse numbers at start
    .replace(/^\d+\s*/, '')
    // Remove paragraph markers
    .replace(/¶\s*/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Clean up punctuation for better flow
    .replace(/([.!?])\s+/g, '$1 ')
    .trim();
}

export async function getGoogleTTS(text) {
  if (!GOOGLE_TTS_API_KEY) {
    throw new Error('Google Cloud API key is required');
  }

  // Preprocess text and wrap in SSML
  const cleanText = preprocessText(text);
  const ssmlText = `<speak>${cleanText}</speak>`;

  const response = await fetch(`${GOOGLE_TTS_API}?key=${GOOGLE_TTS_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { ssml: ssmlText },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-D',
        ssmlGender: 'MALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9,
        pitch: -2,
        volumeGainDb: 0
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`TTS API error: ${error.error?.message || 'Unknown error'}`);
  }

  const { audioContent } = await response.json();
  return audioContent;
}

export async function createAudioPlayer() {
  await Audio.setAudioModeAsync(AUDIO_CONFIG);
  return new Audio.Sound();
}

export async function playAudioContent(audioContent, onPlaybackStatusUpdate) {
  try {
    const sound = await createAudioPlayer();

    // Convert base64 to URI
    const audioUri = `data:audio/mp3;base64,${audioContent}`;

    // Load audio without setting up status listener yet
    await sound.loadAsync(
      { uri: audioUri },
      { shouldPlay: false }
    );

    // Set up status listener only if provided
    if (onPlaybackStatusUpdate) {
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    }

    return sound;
  } catch (error) {
    console.error('Error creating audio player:', error);
    throw error;
  }
} 