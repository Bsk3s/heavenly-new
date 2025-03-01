import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBooks, getChapters } from '../api/bibleService';
import { ALL_BOOKS } from '../constants/books';

/**
 * Hook to manage Bible navigation (books and chapters)
 * @param {string} bibleId - The ID of the current Bible version
 * @returns {Object} Bible navigation state and functions
 */
export const useBibleNavigation = (bibleId) => {
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [currentBookId, setCurrentBookId] = useState(null);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [error, setError] = useState(null);

  // Get current book and chapter objects
  const currentBook = books.find(b => b.id === currentBookId);
  const currentChapter = chapters.find(c => c.id === currentChapterId);

  // Load books
  useEffect(() => {
    const loadBooks = async () => {
      if (!bibleId) {
        console.log('No Bible ID provided');
        setLoadingBooks(false);
        return;
      }

      try {
        setLoadingBooks(true);
        const fetchedBooks = await getBooks(bibleId);
        
        // Sort books according to biblical order
        const sortedBooks = fetchedBooks.sort((a, b) => {
          const aIndex = ALL_BOOKS.findIndex(book => book.name === a.name);
          const bIndex = ALL_BOOKS.findIndex(book => book.name === b.name);
          return aIndex - bIndex;
        });

        setBooks(sortedBooks);
        
        // Set default book if none selected
        const savedBookId = await AsyncStorage.getItem('currentBookId');
        if (!savedBookId && sortedBooks.length > 0) {
          setCurrentBookId(sortedBooks[0].id);
          AsyncStorage.setItem('currentBookId', sortedBooks[0].id);
        } else if (savedBookId) {
          setCurrentBookId(savedBookId);
        }
        
        setLoadingBooks(false);
      } catch (error) {
        console.error('Error loading books:', error);
        setBooks([]);
        setCurrentBookId(null);
        setLoadingBooks(false);
      }
    };

    loadBooks();
  }, [bibleId]);

  // Load chapters when book changes
  useEffect(() => {
    const loadChapters = async () => {
      if (!bibleId || !currentBookId) {
        console.log('No Bible ID or Book ID provided');
        setLoadingChapters(false);
        return;
      }

      try {
        setLoadingChapters(true);
        const fetchedChapters = await getChapters(bibleId, currentBookId);
        setChapters(fetchedChapters);
        
        // Set default chapter if none selected
        const savedChapterId = await AsyncStorage.getItem('currentChapterId');
        if (!savedChapterId && fetchedChapters.length > 0) {
          setCurrentChapterId(fetchedChapters[0].id);
          AsyncStorage.setItem('currentChapterId', fetchedChapters[0].id);
        } else if (savedChapterId) {
          // Verify the saved chapter exists in current book
          const chapterExists = fetchedChapters.some(ch => ch.id === savedChapterId);
          if (chapterExists) {
            setCurrentChapterId(savedChapterId);
          } else if (fetchedChapters.length > 0) {
            setCurrentChapterId(fetchedChapters[0].id);
            AsyncStorage.setItem('currentChapterId', fetchedChapters[0].id);
          }
        }
        
        setLoadingChapters(false);
      } catch (error) {
        console.error('Error loading chapters:', error);
        setChapters([]);
        setCurrentChapterId(null);
        setLoadingChapters(false);
      }
    };

    loadChapters();
  }, [bibleId, currentBookId]);

  const changeBook = async (bookId) => {
    setCurrentBookId(bookId);
    await AsyncStorage.setItem('currentBookId', bookId);
  };

  const changeChapter = async (chapterId) => {
    setCurrentChapterId(chapterId);
    await AsyncStorage.setItem('currentChapterId', chapterId);
  };

  const navigateChapter = async (direction) => {
    if (!chapters.length) return false;

    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    if (currentIndex === -1) return false;

    if (direction === 'next' && currentIndex < chapters.length - 1) {
      await changeChapter(chapters[currentIndex + 1].id);
      return true;
    } else if (direction === 'prev' && currentIndex > 0) {
      await changeChapter(chapters[currentIndex - 1].id);
      return true;
    } else if (direction === 'next' && books.length > 0) {
      // Move to next book
      const currentBookIndex = books.findIndex(b => b.id === currentBookId);
      if (currentBookIndex < books.length - 1) {
        await changeBook(books[currentBookIndex + 1].id);
        return true;
      }
    } else if (direction === 'prev' && books.length > 0) {
      // Move to previous book
      const currentBookIndex = books.findIndex(b => b.id === currentBookId);
      if (currentBookIndex > 0) {
        await changeBook(books[currentBookIndex - 1].id);
        return true;
      }
    }

    return false;
  };

  return {
    books,
    chapters,
    currentBookId,
    currentChapterId,
    currentBook,
    currentChapter,
    changeBook,
    changeChapter,
    navigateChapter,
    loadingBooks,
    loadingChapters,
    error
  };
}; 