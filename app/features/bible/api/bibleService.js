// Bible API Service
// This service handles all interactions with the API.Bible service
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig.extra.bibleApiKey || 'c9afcb2ed06b4d336db834d2e03526cf';
const BASE_URL = 'https://api.scripture.api.bible/v1';

// Headers for API requests
const headers = {
  'api-key': API_KEY,
  'Content-Type': 'application/json',
};

// Error handler
const handleApiError = async (response, context) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const status = response.status;
    let errorMessage = `Failed to ${context}`;

    if (status === 401) {
      errorMessage = 'Invalid or missing Bible API key. Please check your API key configuration.';
    } else if (status === 403) {
      errorMessage = 'Access forbidden. Your API key may not have the necessary permissions.';
    } else if (status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }

    console.error(`Bible API Error (${context}):`, {
      status,
      statusText: response.statusText,
      errorData,
      message: errorMessage
    });
    
    throw new Error(errorMessage);
  }
  return response;
};

/**
 * Get all available Bible versions
 * @returns {Promise} Promise object with Bible versions
 */
export const getBibleVersions = async () => {
  try {
    const response = await fetch(`${BASE_URL}/bibles`, {
      method: 'GET',
      headers,
    });
    
    await handleApiError(response, 'fetch Bible versions');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Bible versions:', error);
    throw error;
  }
};

/**
 * Get books for a specific Bible version
 * @param {string} bibleId - The ID of the Bible version
 * @returns {Promise} Promise object with books
 */
export const getBooks = async (bibleId) => {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

/**
 * Get chapters for a specific book
 * @param {string} bibleId - The ID of the Bible version
 * @param {string} bookId - The ID of the book
 * @returns {Promise} Promise object with chapters
 */
export const getChapters = async (bibleId, bookId) => {
  try {
    console.log('Fetching chapters for:', { bibleId, bookId });
    
    if (!bibleId || !bookId) {
      throw new Error('Bible ID and Book ID are required');
    }

    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books/${bookId}/chapters`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`Failed to fetch chapters: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Raw chapters data:', data);

    if (!data || !data.data) {
      throw new Error('Invalid response format from API');
    }

    // Process chapters to ensure they have all required fields and filter out intros
    const processedChapters = data.data
      .filter(chapter => {
        // Filter out intro chapters and ensure it's a valid chapter
        const chapterNum = parseInt(chapter.number, 10);
        return !isNaN(chapterNum) && chapter.number !== 'intro';
      })
      .map(chapter => ({
        id: chapter.id,
        bookId: chapter.bookId,
        number: chapter.number,
        reference: chapter.reference || `Chapter ${chapter.number}`
      }));

    // Sort chapters by number
    processedChapters.sort((a, b) => {
      const aNum = parseInt(a.number, 10);
      const bNum = parseInt(b.number, 10);
      return aNum - bNum;
    });

    console.log('Processed chapters:', processedChapters);
    return processedChapters;
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }
};

/**
 * Get content for a specific chapter
 * @param {string} bibleId - The ID of the Bible version
 * @param {string} chapterId - The ID of the chapter
 * @returns {Promise} Promise object with chapter content
 */
export const getChapterContent = async (bibleId, chapterId) => {
  try {
    console.log('Fetching chapter content:', { bibleId, chapterId });

    // Skip intro chapters
    if (chapterId.endsWith('.intro')) {
      throw new Error('Cannot fetch content for intro chapters');
    }

    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`Failed to fetch chapter content: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Raw API response:', data);
    
    if (!data.data) {
      throw new Error('Invalid response format from Bible API');
    }

    // Process the response to ensure we have the correct format
    const processedData = {
      id: data.data.id,
      bookId: data.data.bookId,
      number: data.data.number,
      reference: data.data.reference,
      verses: []
    };

    // Parse HTML content to extract verses
    if (typeof data.data.content === 'string') {
      const content = data.data.content;
      
      // Find all verse spans in the content
      const verses = [];
      let currentVerseNum = 0;
      let currentVerseText = '';
      
      // First, clean up the HTML content
      const cleanContent = content
        .replace(/<\/?p>/g, ' ')  // Replace paragraph tags with spaces
        .replace(/<br\s*\/?>/g, ' ')  // Replace line breaks with spaces
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .trim();
      
      // Split content by verse markers
      const verseParts = cleanContent.split(/<span[^>]*data-number="(\d+)"[^>]*class="v"[^>]*>\d+<\/span>/);
      
      for (let i = 1; i < verseParts.length; i += 2) {
        const verseNum = parseInt(verseParts[i], 10);
        let verseText = verseParts[i + 1] || '';
        
        // Clean up the verse text
        verseText = verseText
          .replace(/<[^>]+>/g, ' ')  // Remove any remaining HTML tags
          .replace(/\s+/g, ' ')  // Normalize whitespace
          .trim();
        
        if (verseNum && verseText) {
          verses.push({
            id: `${chapterId}.${verseNum}`,
            number: verseNum,
            text: verseText
          });
        }
      }
      
      processedData.verses = verses;
    }

    // Sort verses by number
    processedData.verses.sort((a, b) => a.number - b.number);
    
    console.log('Processed chapter data with verses:', processedData);
    return processedData;
  } catch (error) {
    console.error('Error fetching chapter content:', error);
    throw error;
  }
};

/**
 * Search the Bible for a specific term
 * @param {string} bibleId - The ID of the Bible version
 * @param {string} query - The search term
 * @returns {Promise} Promise object with search results
 */
export const searchBible = async (bibleId, query) => {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=20`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to search Bible');
    }
    
    const data = await response.json();
    
    // Process search results to match verse format
    if (data.data && data.data.verses) {
      return {
        ...data.data,
        verses: data.data.verses.map(verse => ({
          id: verse.id,
          reference: verse.reference,
          text: typeof verse.text === 'string' ? verse.text.trim() : '',
          number: parseInt(verse.reference.split(':')[1], 10) || 1
        }))
      };
    }
    
    return data.data;
  } catch (error) {
    console.error('Error searching Bible:', error);
    throw error;
  }
};

/**
 * Get a specific verse
 * @param {string} bibleId - The ID of the Bible version
 * @param {string} verseId - The ID of the verse
 * @returns {Promise} Promise object with verse content
 */
export const getVerse = async (bibleId, verseId) => {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/verses/${verseId}?content-type=text`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch verse');
    }
    
    const data = await response.json();
    
    // Process verse data to ensure consistent format
    if (data.data) {
      return {
        ...data.data,
        text: typeof data.data.text === 'string' ? data.data.text.trim() : '',
        number: parseInt(data.data.reference.split(':')[1], 10) || 1
      };
    }
    
    throw new Error('Invalid verse data format');
  } catch (error) {
    console.error('Error fetching verse:', error);
    throw error;
  }
}; 