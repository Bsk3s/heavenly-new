import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class TextToSpeech {
  constructor() {
    this.isSpeaking = false;
    this.currentText = null;
  }

  async speak(text) {
    try {
      // Stop any existing speech
      await this.stop();
      
      this.currentText = text;
      this.isSpeaking = true;

      // Basic configuration that works on both iOS and Android
      const options = {
        language: 'en-US',
        pitch: 1.0,
        rate: Platform.OS === 'ios' ? 0.5 : 0.8, // Different rate scaling on iOS vs Android
      };

      return await Speech.speak(text, {
        ...options,
        onStart: () => {
          this.isSpeaking = true;
        },
        onDone: () => {
          this.isSpeaking = false;
          this.currentText = null;
        },
        onStopped: () => {
          this.isSpeaking = false;
          this.currentText = null;
        },
        onError: (error) => {
          console.error('Speech error:', error);
          this.isSpeaking = false;
          this.currentText = null;
        }
      });
    } catch (error) {
      console.error('Speech error:', error);
      this.isSpeaking = false;
      this.currentText = null;
      throw error;
    }
  }

  async stop() {
    try {
      if (this.isSpeaking) {
        this.isSpeaking = false;
        this.currentText = null;
        await Speech.stop();
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  async pause() {
    try {
      if (this.isSpeaking) {
        await Speech.pause();
      }
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }

  async resume() {
    try {
      if (this.currentText) {
        await Speech.resume();
      }
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }
}

export default new TextToSpeech(); 