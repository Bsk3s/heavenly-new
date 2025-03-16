import { BIBLE_BRAIN_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

// Debug the API key
console.log('Bible Brain API Key from env:', BIBLE_BRAIN_API_KEY);
console.log('Bible Brain API Key type:', typeof BIBLE_BRAIN_API_KEY);

// Bible Brain API base URL
const API_BASE_URL = 'https://4.dbt.io/api';
const API_VERSION = 'v1';

// Ensure API key is valid
const getApiKey = () => {
  if (!BIBLE_BRAIN_API_KEY) {
    throw new Error('Bible Brain API key is not set');
  }
  return BIBLE_BRAIN_API_KEY.trim();
};

// Default headers for API requests
const getHeaders = () => {
  const apiKey = getApiKey();
  console.log('Using Bible Brain API Key in headers:', apiKey);
  return {
    'v': API_VERSION,
    'key': apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};

// Helper function to make API requests
const makeRequest = async (endpoint, params = {}) => {
  const apiKey = getApiKey();
  const queryParams = new URLSearchParams({
    v: API_VERSION,
    key: apiKey,
    ...params
  }).toString();
  
  const url = `${API_BASE_URL}${endpoint}?${queryParams}`;
  console.log('Making request to:', url);
  
  const response = await fetch(url, {
    headers: getHeaders()
  });
  
  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error response:', errorText);
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Bible Brain API Service
 * Provides methods to interact with the Bible Brain API for text and audio content
 */
const bibleBrainService = {
  /**
   * Test the API connection to ensure credentials are valid
   * @returns {Promise<Object>} Connection status
   */
  async testAPIConnection() {
    try {
      await makeRequest('/bibles', { language_code: 'eng', limit: 1 });
      return { success: true };
    } catch (error) {
      console.error('Bible Brain API connection error:', error);
      return { 
        success: false, 
        message: `Connection error: ${error.message}` 
      };
    }
  },

  /**
   * Get available Bible versions
   * @param {string} languageCode - ISO language code (default: 'eng' for English)
   * @returns {Promise<Array>} List of available Bible versions
   */
  async getBibleVersions(languageCode = 'eng') {
    try {
      const data = await makeRequest('/bibles', {
        language_code: languageCode,
        limit: 50
      });
      
      // Filter to include only versions with both text and audio
      return data.data.filter(bible => 
        bible.hasAudio && 
        bible.hasText && 
        bible.audioBibles && 
        bible.audioBibles.length > 0
      ).map(bible => ({
        id: bible.id,
        name: bible.name,
        nameLocal: bible.nameLocal || bible.name,
        description: bible.description || '',
        language: bible.language,
        abbreviation: bible.abbreviation || bible.id,
        audioBibles: bible.audioBibles.map(audio => ({
          id: audio.id,
          name: audio.name,
          description: audio.description || ''
        }))
      }));
    } catch (error) {
      console.error('Error fetching Bible versions:', error);
      throw error;
    }
  },

  /**
   * Get books available for a specific Bible version
   * @param {string} bibleId - Bible version ID
   * @returns {Promise<Array>} List of available books
   */
  async getBooks(bibleId) {
    try {
      const data = await makeRequest(`/bibles/${bibleId}/books`);
      return data.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  /**
   * Get chapter text content
   * @param {string} bibleId - Bible version ID
   * @param {string} bookId - Book ID
   * @param {number} chapter - Chapter number
   * @returns {Promise<Object>} Chapter content
   */
  async getChapterText(bibleId, bookId, chapter) {
    try {
      const data = await makeRequest(`/bibles/${bibleId}/chapters/${bookId}.${chapter}`);
      return data.data;
    } catch (error) {
      console.error('Error fetching chapter text:', error);
      throw error;
    }
  },

  /**
   * Get chapter audio content
   * @param {string} audioBibleId - Audio Bible ID
   * @param {string} bookId - Book ID
   * @param {number} chapter - Chapter number
   * @returns {Promise<Object>} Audio content information
   */
  async getChapterAudio(audioBibleId, bookId, chapter) {
    try {
      const data = await makeRequest(`/audio-bibles/${audioBibleId}/chapters/${bookId}.${chapter}`);
      return data.data;
    } catch (error) {
      console.error('Error fetching chapter audio:', error);
      throw error;
    }
  },

  /**
   * Get verse timings for audio content
   * @param {string} audioBibleId - Audio Bible ID
   * @param {string} bookId - Book ID
   * @param {number} chapter - Chapter number
   * @returns {Promise<Object>} Verse timing information
   */
  async getVerseTimings(audioBibleId, bookId, chapter) {
    try {
      const data = await makeRequest(`/audio-bibles/${audioBibleId}/timestamps/${bookId}.${chapter}`);
      return data.data;
    } catch (error) {
      console.error('Error fetching verse timings:', error);
      throw error;
    }
  },

  /**
   * Load and prepare audio for playback
   * @param {string} audioUrl - URL to the audio file
   * @returns {Promise<Object>} Audio object ready for playback
   */
  async loadAudio(audioUrl) {
    try {
      // Create a new sound object
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 }
      );
      
      return { sound, status };
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  },

  /**
   * Get a complete chapter with both text and audio information
   * @param {string} bibleId - Bible version ID
   * @param {string} audioBibleId - Audio Bible ID
   * @param {string} bookId - Book ID (e.g., 'GEN', 'MAT')
   * @param {string|number} chapterId - Chapter number
   * @returns {Promise<Object>} Complete chapter data with text, audio URL, and verse timings
   */
  async getCompleteChapter(bibleId, audioBibleId, bookId, chapterId) {
    try {
      // Fetch text, audio, and timing data in parallel
      const [chapterText, chapterAudio, verseTimings] = await Promise.all([
        this.getChapterText(bibleId, bookId, chapterId),
        this.getChapterAudio(bibleId, audioBibleId, bookId, chapterId),
        this.getVerseTimings(audioBibleId, bookId, chapterId)
      ]);
      
      return {
        ...chapterText,
        audio: chapterAudio,
        verseTimings
      };
    } catch (error) {
      console.error(`Error fetching complete chapter data for ${bookId}.${chapterId}:`, error);
      throw error;
    }
  }
};

export default bibleBrainService; 