import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AUDIO_CONFIG } from '../../audio/constants/audio';
import { GOOGLE_TTS_API_KEY } from '@env';

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

export const getGoogleTTS = async (text) => {
  if (!GOOGLE_TTS_API_KEY) {
    throw new Error('Google Cloud API key is required');
  }

  try {
    // Preprocess text and wrap in SSML if needed
    const cleanText = preprocessText(text);
    const ssmlText = text.includes('<speak>') ? text : `<speak>${cleanText}</speak>`;

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
    } catch (error) {
    console.error('TTS API error:', error);
      throw error;
  }
};

export const combineAudioBuffers = (buffers) => {
  return Buffer.concat(buffers);
};

export const createAudioFromBuffer = async (buffer) => {
  try {
    // Create a temporary file
    const tempFile = `${FileSystem.cacheDirectory}/temp_audio_${Date.now()}.mp3`;

    // Write the buffer to the file
    await FileSystem.writeAsStringAsync(tempFile, buffer.toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Load the audio
    const { sound, status } = await Audio.Sound.createAsync(
      { uri: tempFile },
      { shouldPlay: false }
    );

    // Clean up the temp file after loading
    await FileSystem.deleteAsync(tempFile);

    return { sound, status };
    } catch (error) {
    console.error('Error creating audio from buffer:', error);
      throw error;
    }
};

export async function createAudioPlayer() {
  await Audio.setAudioModeAsync(AUDIO_CONFIG);
  return new Audio.Sound();
}

export async function playAudioContent(audioContent, onPlaybackStatusUpdate) {
  try {
    const sound = await createAudioPlayer();

    // Convert base64 to URI
    const audioUri = `data:audio/mp3;base64,${audioContent}`;

    // Load audio
    await sound.loadAsync(
      { uri: audioUri },
      { shouldPlay: false }
    );

    // Set up status listener if provided
    if (onPlaybackStatusUpdate) {
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    }

    return sound;
    } catch (error) {
    console.error('Error creating audio player:', error);
      throw error;
    }
  }

const ttsService = {
  // ... existing functions ...
};

export default ttsService;