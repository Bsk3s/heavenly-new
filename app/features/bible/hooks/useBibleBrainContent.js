import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleBrainService from '../services/bibleBrainService';

/**
 * Custom hook for managing Bible content from Bible Brain API
 * @param {string} bibleId - Bible version ID
 * @param {string} bookId - Book ID (e.g., 'GEN', 'MAT')
 * @param {string|number} chapterId - Chapter number
 * @returns {Object} Bible content state and methods
 */
export default function useBibleBrainContent(bibleId, bookId, chapterId) {
  // State for Bible content
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const [books, setBooks] = useState([]);
  const [availableBibles, setAvailableBibles] = useState([]);
  const [selectedBible, setSelectedBible] = useState(null);

  // Load available Bible versions
  const loadBibleVersions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from cache first
      const cachedVersions = await AsyncStorage.getItem('bibleBrain_versions');
      
      if (cachedVersions) {
        const parsedVersions = JSON.parse(cachedVersions);
        setAvailableBibles(parsedVersions);
      }
      
      // Fetch fresh data from API
      const versions = await bibleBrainService.getBibleVersions();
      
      // Update state and cache
      setAvailableBibles(versions);
      await AsyncStorage.setItem('bibleBrain_versions', JSON.stringify(versions));
      
      // Set default Bible if none selected
      if (!selectedBible && versions.length > 0) {
        const defaultBible = versions.find(bible => bible.id === bibleId) || versions[0];
        setSelectedBible(defaultBible);
        await AsyncStorage.setItem('bibleBrain_selectedBible', JSON.stringify(defaultBible));
      }
    } catch (err) {
      console.error('Error loading Bible versions:', err);
      setError('Failed to load Bible versions. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [bibleId, selectedBible]);

  // Load books for the selected Bible
  const loadBooks = useCallback(async (targetBibleId) => {
    try {
      setLoading(true);
      setError(null);
      
      const bibleToUse = targetBibleId || (selectedBible ? selectedBible.id : bibleId);
      
      if (!bibleToUse) {
        throw new Error('No Bible selected');
      }
      
      // Try to get from cache first
      const cacheKey = `bibleBrain_books_${bibleToUse}`;
      const cachedBooks = await AsyncStorage.getItem(cacheKey);
      
      if (cachedBooks) {
        const parsedBooks = JSON.parse(cachedBooks);
        setBooks(parsedBooks);
      }
      
      // Fetch fresh data from API
      const booksData = await bibleBrainService.getBooks(bibleToUse);
      
      // Update state and cache
      setBooks(booksData);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(booksData));
    } catch (err) {
      console.error('Error loading books:', err);
      setError('Failed to load Bible books. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [bibleId, selectedBible]);

  // Load chapter content
  const loadChapter = useCallback(async (targetBibleId, targetBookId, targetChapterId) => {
    try {
      setLoading(true);
      setError(null);
      
      const bibleToUse = targetBibleId || (selectedBible ? selectedBible.id : bibleId);
      const bookToUse = targetBookId || bookId;
      const chapterToUse = targetChapterId || chapterId;
      
      if (!bibleToUse || !bookToUse || !chapterToUse) {
        throw new Error('Missing required parameters for loading chapter');
      }
      
      // Try to get from cache first
      const cacheKey = `bibleBrain_chapter_${bibleToUse}_${bookToUse}_${chapterToUse}`;
      const cachedChapter = await AsyncStorage.getItem(cacheKey);
      
      if (cachedChapter) {
        const parsedChapter = JSON.parse(cachedChapter);
        setContent(parsedChapter);
      }
      
      // Fetch fresh data from API
      const chapterData = await bibleBrainService.getChapterText(bibleToUse, bookToUse, chapterToUse);
      
      // Update state and cache
      setContent(chapterData);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(chapterData));
    } catch (err) {
      console.error('Error loading chapter:', err);
      setError(`Failed to load chapter ${bookId} ${chapterId}. Please check your connection.`);
    } finally {
      setLoading(false);
    }
  }, [bibleId, bookId, chapterId, selectedBible]);

  // Change Bible version
  const changeBibleVersion = useCallback(async (newBibleId) => {
    try {
      if (!newBibleId) return;
      
      const newBible = availableBibles.find(bible => bible.id === newBibleId);
      
      if (!newBible) {
        throw new Error(`Bible version ${newBibleId} not found`);
      }
      
      setSelectedBible(newBible);
      await AsyncStorage.setItem('bibleBrain_selectedBible', JSON.stringify(newBible));
      
      // Reload books and current chapter with new Bible version
      await loadBooks(newBibleId);
      await loadChapter(newBibleId, bookId, chapterId);
    } catch (err) {
      console.error('Error changing Bible version:', err);
      setError('Failed to change Bible version. Please try again.');
    }
  }, [availableBibles, bookId, chapterId, loadBooks, loadChapter]);

  // Initialize hook
  useEffect(() => {
    const initializeHook = async () => {
      try {
        // Load saved Bible selection
        const savedBible = await AsyncStorage.getItem('bibleBrain_selectedBible');
        
        if (savedBible) {
          setSelectedBible(JSON.parse(savedBible));
        }
        
        // Load Bible versions
        await loadBibleVersions();
      } catch (err) {
        console.error('Error initializing Bible content hook:', err);
        setError('Failed to initialize Bible content. Please restart the app.');
      }
    };
    
    initializeHook();
  }, [loadBibleVersions]);

  // Load books when Bible changes
  useEffect(() => {
    if (selectedBible) {
      loadBooks(selectedBible.id);
    }
  }, [selectedBible, loadBooks]);

  // Load chapter when parameters change
  useEffect(() => {
    if (selectedBible && bookId && chapterId) {
      loadChapter(selectedBible.id, bookId, chapterId);
    }
  }, [selectedBible, bookId, chapterId, loadChapter]);

  return {
    loading,
    error,
    content,
    books,
    availableBibles,
    selectedBible,
    loadBibleVersions,
    loadBooks,
    loadChapter,
    changeBibleVersion,
    refresh: () => loadChapter(selectedBible?.id, bookId, chapterId)
  };
} 