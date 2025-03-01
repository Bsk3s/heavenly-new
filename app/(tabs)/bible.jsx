import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Import hooks
import { useBibleVersions } from '../features/bible/hooks/useBibleVersions';
import { useBibleNavigation } from '../features/bible/hooks/useBibleNavigation';
import { useBibleContent } from '../features/bible/hooks/useBibleContent';
import { useVerseInteractions } from '../features/bible/hooks/useVerseInteractions';
import { useBibleAudio } from '../features/bible/hooks/useBibleAudio';

// Import contexts and providers
import { VersesProvider } from '../features/bible/contexts/VersesContext';
import { AudioProvider } from '../features/bible/contexts/AudioContext';

// Import components
import BibleHeader from '../features/bible/components/BibleHeader';
import SearchBar from '../features/bible/components/SearchBar';
import VerseItem from '../features/bible/components/VerseItem';
import NavigationControls from '../features/bible/components/NavigationControls';
import SelectionModal from '../features/bible/components/SelectionModal';

// Import API service
import { searchBible } from '../features/bible/api/bibleService';

function BibleContent() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  
  // State for UI
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // State for modals
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);

  // Use custom hooks
  const { 
    versions,
    categorizedVersions,
    currentVersionId, 
    currentVersion, 
    changeVersion, 
    loading: loadingVersions 
  } = useBibleVersions();
  
  const { 
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
    loadingChapters 
  } = useBibleNavigation(currentVersionId);
  
  const { 
    reference,
    chapterTitle,
    parsedVerses, 
    loading: loadingContent 
  } = useBibleContent(currentVersionId, currentChapterId);
  
  const { 
    highlightedVerses, 
    selectedVerse,
    toggleHighlight,
    selectVerse, 
    discussVerse 
  } = useVerseInteractions(currentVersionId, currentBookId, currentChapterId);

  const {
    isPlaying,
    isProcessing: isAudioProcessing,
    currentVerseIndex,
    error,
    playVerse,
    pausePlayback,
    resumePlayback,
    stopPlayback
  } = useBibleAudio(parsedVerses, {
    book: currentBook?.name,
    chapter: currentChapter?.number
  });

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentVersionId) return;
    
    try {
      setIsSearching(true);
      const results = await searchBible(currentVersionId, searchQuery);
      setSearchResults(results.verses || []);
      setIsSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setIsSearching(false);
    }
  };
  
  // Handle navigation
  const handleNavigate = async (direction) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await navigateChapter(direction);
    if (success) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };
  
  // Handle version selection
  const handleVersionSelect = async (versionId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeVersion(versionId);
    setShowVersionModal(false);
  };
  
  // Handle book selection
  const handleBookSelect = async (bookId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeBook(bookId);
    setShowBookModal(false);
    setShowChapterModal(true);
  };
  
  // Handle chapter selection
  const handleChapterSelect = async (chapterId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeChapter(chapterId);
    setShowChapterModal(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  
  // Handle verse selection
  const handleVersePress = (verseId) => {
    selectVerse(verseId);
  };
  
  // Handle verse highlight
  const handleVerseHighlight = async (verseId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleHighlight(verseId);
  };
  
  // Handle verse discussion
  const handleVerseDiscuss = async (verseId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    discussVerse(verseId);
  };
  
  // Handle audio toggle
  const handleAudioPress = useCallback(() => {
    if (isPlaying) {
      pausePlayback();
    } else if (currentVerseIndex > 0) {
      resumePlayback();
    } else {
      playVerse(0);
    }
  }, [isPlaying, currentVerseIndex, pausePlayback, resumePlayback, playVerse]);
  
  // Loading state
  const isLoading = loadingVersions || loadingBooks || loadingChapters || loadingContent;
  
  // Prepare version sections for the modal
  const versionSections = [
    {
      title: 'Popular English Versions',
      data: categorizedVersions.priorityEnglish || []
    },
    {
      title: 'Other English Versions',
      data: categorizedVersions.otherEnglish || []
    },
    ...Object.entries(categorizedVersions.otherLanguages || {}).map(([language, versions]) => ({
      title: language,
      data: versions
    }))
  ].filter(section => section.data.length > 0);

  // Render version item for modal
  const renderVersionItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleVersionSelect(item.id)}
      className={`p-3 rounded-lg mb-2 ${currentVersionId === item.id ? 'bg-blue-100' : 'bg-gray-100'}`}
    >
      <Text className="font-medium text-gray-800">{item.abbreviation}</Text>
      <Text className="text-sm text-gray-600">{item.name}</Text>
      {item.language && item.language.name !== 'English' && (
        <Text className="text-xs text-gray-500 mt-1">{item.language.name}</Text>
      )}
    </TouchableOpacity>
  );

  // Render section header for version modal
  const renderVersionSectionHeader = ({ section: { title } }) => (
    <Text className="text-lg font-semibold text-gray-800 mb-2 mt-4 px-1">{title}</Text>
  );

  // Render book item for modal
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleBookSelect(item.id)}
      className={`p-3 rounded-lg mb-2 ${currentBookId === item.id ? 'bg-blue-100' : 'bg-gray-100'}`}
    >
      <Text className="font-medium text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );

  // Render chapter item for modal
  const renderChapterItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleChapterSelect(item.id)}
      className={`flex-1 aspect-1 m-1 items-center justify-center rounded-lg ${
        currentChapterId === item.id ? 'bg-blue-500' : 'bg-gray-100'
      }`}
    >
      <Text 
        className={`font-medium ${
          currentChapterId === item.id ? 'text-white' : 'text-gray-800'
        }`}
      >
        {item.number}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <BibleHeader
        currentBook={currentBook?.name}
        currentChapter={currentChapter?.number}
        currentVersion={currentVersion?.abbreviation}
        onBookPress={() => setShowBookModal(true)}
        onVersionPress={() => setShowVersionModal(true)}
        onAudioPress={handleAudioPress}
        onSearchPress={() => setIsSearchOpen(!isSearchOpen)}
        onMorePress={() => {}}
        isPlaying={isPlaying}
        isLoading={isAudioProcessing}
      />
      
      {isSearchOpen && (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
      )}
      
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#4B5563" />
            <Text className="text-gray-500 mt-2">Loading Bible content...</Text>
          </View>
        ) : isSearchOpen && searchResults.length > 0 ? (
          // Search results
          <>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Search Results for "{searchQuery}"
            </Text>
            {searchResults.map(verse => (
              <VerseItem
                key={verse.id}
                verse={verse}
                isHighlighted={highlightedVerses.includes(verse.id)}
                isSelected={selectedVerse === verse.id}
                onPress={() => handleVersePress(verse.id)}
                onHighlight={handleVerseHighlight}
                onDiscuss={handleVerseDiscuss}
              />
            ))}
          </>
        ) : isSearchOpen && isSearching ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="small" color="#4B5563" />
            <Text className="text-gray-500 mt-2">Searching...</Text>
          </View>
        ) : isSearchOpen && searchQuery && searchResults.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-500">No results found for "{searchQuery}"</Text>
          </View>
        ) : (
          // Bible content
          <>
            {reference && (
              <Text 
                className="text-gray-900 mb-4 mt-4"
                style={{
                  fontSize: 28,
                  fontWeight: '600',
                  letterSpacing: 0.3
                }}
              >
                {reference}
              </Text>
            )}
            
            {chapterTitle && (
              <Text 
                className="text-gray-900 mb-6"
                style={{
                  fontSize: 24,
                  lineHeight: 32,
                  fontWeight: '600',
                  fontFamily: 'System'
                }}
              >
                {chapterTitle}
              </Text>
            )}
            
            <View className="mb-24">
              {parsedVerses.map((verse, index) => {
                const isFirstInParagraph = index === 0 || 
                  verse.text.startsWith('But ') ||
                  verse.text.startsWith('And ') ||
                  verse.text.startsWith('Then ') ||
                  verse.text.startsWith('Now ') ||
                  verse.text.includes('. ') ||
                  verse.text.length > 150;

                return (
                  <VerseItem
                    key={verse.id}
                    verse={verse}
                    isHighlighted={highlightedVerses.includes(verse.id)}
                    isSelected={selectedVerse === verse.id}
                    onPress={() => handleVersePress(verse.id)}
                    onHighlight={handleVerseHighlight}
                    onDiscuss={handleVerseDiscuss}
                    isFirstInParagraph={isFirstInParagraph}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Navigation Controls */}
      <View className="absolute bottom-6 left-0 right-0 px-4">
        <NavigationControls
          onPrevious={() => handleNavigate('prev')}
          onNext={() => handleNavigate('next')}
          onPlayPause={handleAudioPress}
          isPlaying={isPlaying}
          isProcessing={isAudioProcessing}
        />
      </View>
      
      {/* Modals */}
      <SelectionModal
        visible={showVersionModal}
        title="Select Bible Version"
        sections={versionSections}
        renderItem={renderVersionItem}
        renderSectionHeader={renderVersionSectionHeader}
        onClose={() => setShowVersionModal(false)}
        keyExtractor={(item) => item.id}
      />
      
      <SelectionModal
        visible={showBookModal}
        title="Select Book"
        data={books}
        renderItem={renderBookItem}
        onClose={() => setShowBookModal(false)}
        keyExtractor={(item) => item.id}
        isBookSelection={true}
      />
      
      <SelectionModal
        visible={showChapterModal}
        title="Select Chapter"
        data={chapters}
        renderItem={renderChapterItem}
        onClose={() => setShowChapterModal(false)}
        keyExtractor={(item) => item.id}
        numColumns={5}
      />
    </View>
  );
}

export default function BibleScreen() {
  return (
    <SafeAreaProvider>
      <VersesProvider>
        <AudioProvider>
          <BibleContent />
        </AudioProvider>
      </VersesProvider>
    </SafeAreaProvider>
  );
}
