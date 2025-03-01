import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to manage verse interactions (highlighting, etc.)
 * @param {string} versionId - The ID of the current Bible version
 * @param {string} bookId - The ID of the current book
 * @param {string} chapterId - The ID of the current chapter
 * @returns {Object} Verse interaction state and functions
 */
export function useVerseInteractions(versionId, bookId, chapterId) {
  const [highlightedVerses, setHighlightedVerses] = useState([]);
  const [selectedVerse, setSelectedVerse] = useState(null);

  // Load highlighted verses from storage
  const loadHighlightedVerses = useCallback(async () => {
    try {
      const key = `highlights_${versionId}_${bookId}_${chapterId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setHighlightedVerses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  }, [versionId, bookId, chapterId]);

  // Save highlighted verses to storage
  const saveHighlightedVerses = useCallback(async (verses) => {
    try {
      const key = `highlights_${versionId}_${bookId}_${chapterId}`;
      await AsyncStorage.setItem(key, JSON.stringify(verses));
    } catch (error) {
      console.error('Error saving highlights:', error);
    }
  }, [versionId, bookId, chapterId]);

  // Toggle verse highlight
  const toggleHighlight = useCallback(async (verseId) => {
    const newHighlightedVerses = highlightedVerses.includes(verseId)
      ? highlightedVerses.filter(id => id !== verseId)
      : [...highlightedVerses, verseId];
    
    setHighlightedVerses(newHighlightedVerses);
    await saveHighlightedVerses(newHighlightedVerses);
  }, [highlightedVerses, saveHighlightedVerses]);

  // Select verse for interaction
  const selectVerse = useCallback((verseId) => {
    setSelectedVerse(selectedVerse === verseId ? null : verseId);
  }, [selectedVerse]);

  // Handle verse discussion
  const discussVerse = useCallback((verseId) => {
    // TODO: Implement verse discussion functionality
    console.log('Discuss verse:', verseId);
  }, []);

  return {
    highlightedVerses,
    selectedVerse,
    toggleHighlight,
    selectVerse,
    discussVerse,
    loadHighlightedVerses
  };
} 