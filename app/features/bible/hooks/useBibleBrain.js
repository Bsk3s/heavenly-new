import { useState, useEffect, useCallback } from 'react';
import { useBibleBrainAudio } from '../contexts/BibleBrainAudioContext';
import useBibleBrainContent from './useBibleBrainContent';

/**
 * Combined hook for Bible Brain content and audio
 * @param {string} initialBibleId - Initial Bible version ID
 * @param {string} initialBookId - Initial book ID
 * @param {string|number} initialChapterId - Initial chapter number
 * @returns {Object} Combined Bible content and audio state and methods
 */
export default function useBibleBrain(initialBibleId, initialBookId, initialChapterId) {
  // State for selected audio Bible
  const [selectedAudioBible, setSelectedAudioBible] = useState(null);
  
  // Use the content hook
  const content = useBibleBrainContent(initialBibleId, initialBookId, initialChapterId);
  
  // Use the audio context
  const audio = useBibleBrainAudio();
  
  // Derived state
  const isLoading = content.loading || audio.isLoading;
  const error = content.error || audio.error;
  
  // Set initial audio Bible when Bible version changes
  useEffect(() => {
    if (content.selectedBible && content.selectedBible.audioBibles?.length > 0) {
      // Use the first available audio Bible
      setSelectedAudioBible(content.selectedBible.audioBibles[0]);
    }
  }, [content.selectedBible]);
  
  // Load audio when chapter or audio Bible changes
  useEffect(() => {
    const loadAudioForCurrentChapter = async () => {
      if (
        content.selectedBible && 
        selectedAudioBible && 
        content.content && 
        !audio.isLoading
      ) {
        await audio.loadAudio(
          content.selectedBible.id,
          selectedAudioBible.id,
          content.content.bookId,
          content.content.chapterId
        );
      }
    };
    
    loadAudioForCurrentChapter();
  }, [
    content.selectedBible, 
    selectedAudioBible, 
    content.content, 
    audio.loadAudio
  ]);
  
  // Change audio Bible
  const changeAudioBible = useCallback((audioBibleId) => {
    if (content.selectedBible && content.selectedBible.audioBibles) {
      const newAudioBible = content.selectedBible.audioBibles.find(
        audioBible => audioBible.id === audioBibleId
      );
      
      if (newAudioBible) {
        setSelectedAudioBible(newAudioBible);
      }
    }
  }, [content.selectedBible]);
  
  // Navigate to a different chapter
  const navigateToChapter = useCallback(async (bibleId, bookId, chapterId) => {
    // Stop current audio playback
    if (audio.isPlaying) {
      await audio.stop();
    }
    
    // Load new content
    await content.loadChapter(bibleId, bookId, chapterId);
  }, [audio, content]);
  
  // Play verse
  const playVerse = useCallback(async (verseNumber) => {
    if (audio.isPlaying) {
      await audio.seekToVerse(verseNumber);
    } else {
      await audio.seekToVerse(verseNumber);
      await audio.play();
    }
  }, [audio]);
  
  // Get current verse
  const getCurrentVerse = useCallback(() => {
    if (
      audio.currentVerseIndex >= 0 && 
      audio.verseTimings && 
      audio.verseTimings.length > audio.currentVerseIndex
    ) {
      return audio.verseTimings[audio.currentVerseIndex].verseNumber;
    }
    return null;
  }, [audio.currentVerseIndex, audio.verseTimings]);
  
  return {
    // Content state
    bibles: content.availableBibles,
    selectedBible: content.selectedBible,
    books: content.books,
    chapter: content.content,
    
    // Audio state
    audioBibles: content.selectedBible?.audioBibles || [],
    selectedAudioBible,
    isPlaying: audio.isPlaying,
    isPaused: audio.isPaused,
    currentVerseIndex: audio.currentVerseIndex,
    currentVerse: getCurrentVerse(),
    progress: audio.progress,
    audioSpeed: audio.audioSpeed,
    verseTimings: audio.verseTimings,
    
    // Combined state
    isLoading,
    error,
    
    // Content methods
    changeBibleVersion: content.changeBibleVersion,
    loadBooks: content.loadBooks,
    loadChapter: content.loadChapter,
    
    // Audio methods
    changeAudioBible,
    play: audio.play,
    pause: audio.pause,
    stop: audio.stop,
    seekTo: audio.seekTo,
    seekToVerse: audio.seekToVerse,
    setSpeed: audio.setSpeed,
    
    // Combined methods
    navigateToChapter,
    playVerse,
    clearError: () => {
      content.error && content.setError(null);
      audio.error && audio.clearError();
    }
  };
} 