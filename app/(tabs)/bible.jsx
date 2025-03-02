import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  runOnJS,
  withTiming,
  Extrapolate,
  interpolate,
} from 'react-native-reanimated';

// Import hooks
import useBibleVersions from '../features/bible/hooks/useBibleVersions';
import useBibleNavigation from '../features/bible/hooks/useBibleNavigation';
import useBibleContent from '../features/bible/hooks/useBibleContent';
import useVerseInteractions from '../features/bible/hooks/useVerseInteractions';
import useBibleAudio from '../features/bible/hooks/useBibleAudio';

// Import contexts and providers
import { VersesProvider } from '../features/bible/contexts/VersesContext';
import { AudioProvider } from '../features/bible/contexts/AudioContext';

// Import components
import BibleHeader from '../features/bible/components/BibleHeader';
import SearchBar from '../features/bible/components/SearchBar';
import VerseItem from '../features/bible/components/VerseItem';
import NavigationControls from '../features/bible/components/NavigationControls';
import SelectionModal from '../features/bible/components/SelectionModal';
import AudioError from '../features/bible/components/AudioError';
import AudioPlayer from '../features/bible/components/AudioPlayer';
import FloatingNavigation from '../features/bible/components/FloatingNavigation';

// Import API service
import { searchBible } from '../features/bible/api/bibleService';

// Add padding constant at the top
const HORIZONTAL_PADDING = 20;

// Add this near the top with other utility functions
const formatTime = (seconds) => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Bible = () => {
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

  // State for player expansion
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);

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
    error: audioError,
    progress,
    playVerse,
    pausePlayback,
    resumePlayback,
    stopPlayback
  } = useBibleAudio(parsedVerses, {
    book: currentBook?.name || '',
    chapter: currentChapter?.number || 1
  });

  const translateX = useSharedValue(0);
  const scrollY = useSharedValue(0);

  // Add this with other state
  const progressBarWidth = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Add these with other shared values
  const progressWidth = useSharedValue(0);
  const knobPosition = useSharedValue(0);

  // Add these with other shared values at the top
  const sliderProgress = useSharedValue(0);
  const sliderWidth = useSharedValue(0);

  // Replace the animated styles
  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${sliderProgress.value * 100}%`,
      height: '100%',
      backgroundColor: '#3B82F6',
      borderRadius: 2,
    };
  });

  const knobStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: -8,
      top: -6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#3B82F6',
      transform: [{ scale: isDragging.value ? 1.2 : 1 }],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    };
  });

  // Replace the seek gesture handler
  const seekGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startX = event.x;
      isDragging.value = true;
      runOnJS(pausePlayback)();
      runOnJS(Haptics.selectionAsync)();
    },
    onActive: (event, context) => {
      if (sliderWidth.value === 0) return;
      
      // Calculate position relative to the progress bar
      const progressBarBounds = event.x - context.startX + (sliderProgress.value * sliderWidth.value);
      const newProgress = Math.max(0, Math.min(1, progressBarBounds / sliderWidth.value));
      sliderProgress.value = newProgress;
      runOnJS(updateSeekPosition)(newProgress);
    },
    onEnd: () => {
      isDragging.value = false;
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      runOnJS(finishSeeking)();
    },
  });

  // Add these new handlers for seeking
  const [seekPosition, setSeekPosition] = useState(0);

  const updateSeekPosition = useCallback((progress) => {
    setSeekPosition(progress);
  }, []);

  const finishSeeking = useCallback(async () => {
    try {
      if (seekPosition >= 0) {
        const newTime = progress.duration * seekPosition;
        await playVerse(currentVerseIndex, newTime);
      }
    } catch (err) {
      console.error('Error seeking:', err);
    }
  }, [seekPosition, progress.duration, currentVerseIndex, playVerse]);

  // Update the layout callback
  const onProgressBarLayout = useCallback((event) => {
    const { width } = event.nativeEvent.layout;
    sliderWidth.value = width;
  }, []);

  // Update the progress effect
  useEffect(() => {
    if (!isDragging.value) {
      sliderProgress.value = progress.progress || 0;
    }
  }, [progress.progress]);

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

  // Handle audio retry
  const handleAudioRetry = useCallback(async () => {
    await stopPlayback();
    await new Promise(resolve => setTimeout(resolve, 500)); // Add small delay
    await playVerse(currentVerseIndex);
  }, [currentVerseIndex, stopPlayback, playVerse]);

  // Handle audio seek
  const seekToPosition = useCallback(async (newProgress) => {
    try {
      if (isAudioProcessing) return;

      // Pause current playback
      await pausePlayback();

      // Calculate new position
      const newTime = progress.duration * newProgress;

      // Play from new position
      await playVerse(currentVerseIndex, newTime);
    } catch (err) {
      console.error('Error seeking to position:', err);
    }
  }, [isAudioProcessing, progress.duration, currentVerseIndex, pausePlayback, playVerse]);

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
      className={`flex-1 aspect-1 m-1 items-center justify-center rounded-lg ${currentChapterId === item.id ? 'bg-blue-500' : 'bg-gray-100'
        }`}
    >
      <Text
        className={`font-medium ${currentChapterId === item.id ? 'text-white' : 'text-gray-800'
          }`}
      >
        {item.number}
      </Text>
    </TouchableOpacity>
  );

  // Add scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />

        <View style={{ paddingHorizontal: HORIZONTAL_PADDING }}>
          <BibleHeader
            currentBook={currentBook?.name}
            currentChapter={currentChapter?.number}
            currentVersion={currentVersion?.abbreviation}
            onBookPress={() => setShowBookModal(true)}
            onVersionPress={() => setShowVersionModal(true)}
            onAudioPress={handleAudioPress}
            onSearchPress={() => setIsSearchOpen(!isSearchOpen)}
            onMorePress={() => { }}
            isPlaying={isPlaying}
            isLoading={isAudioProcessing}
            className="bg-white"
          />

          {/* Subtle Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
              marginBottom: 8,
            }}
          />

          {isSearchOpen && (
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearch}
            />
          )}

          {/* Audio Progress Section */}
          {isPlaying && (
            <View style={{ marginBottom: 12 }}>
              {/* Verse Counter and Time */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
              }}>
                <Text style={{ fontSize: 14, color: '#64748B' }}>
                  Verse {currentVerseIndex + 1} of {parsedVerses.length}
                </Text>
                <Text style={{ fontSize: 14, color: '#64748B' }}>
                  {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
                </Text>
              </View>

              {/* Progress Bar */}
              <PanGestureHandler onGestureEvent={seekGestureHandler}>
                <Animated.View
                  onLayout={onProgressBarLayout}
                  style={{
                    height: 30,
                    justifyContent: 'center',
                    paddingVertical: 12,
                  }}
                >
                  <View style={{
                    height: 4,
                    backgroundColor: 'rgba(226, 232, 240, 0.8)',
                    borderRadius: 2,
                    overflow: 'visible',
                  }}>
                    <Animated.View style={progressBarStyle}>
                      <Animated.View style={knobStyle} />
                    </Animated.View>
                  </View>
                </Animated.View>
              </PanGestureHandler>
            </View>
          )}

          {audioError && (
            <AudioError
              error={audioError}
              onRetry={handleAudioRetry}
              style={{ marginTop: 8, marginBottom: 4 }}
            />
          )}
        </View>

        {/* Main Content with Gesture Zones */}
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
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
                    letterSpacing: 0.3,
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
                    fontFamily: 'System',
                  }}
                >
                  {chapterTitle}
                </Text>
              )}

              <View className="mb-24">
                {parsedVerses.map((verse, index) => (
                  <Pressable
                    key={verse.id}
                    onPress={() => handleVersePress(verse.id)}
                    className={`py-2 ${currentVerseIndex === index ? 'bg-gray-50' : ''
                      }`}
                  >
                    <Text className="text-base leading-relaxed">
                      <Text className="text-gray-400">{verse.number} </Text>
                      {verse.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </Animated.ScrollView>

        {/* Floating Navigation */}
        {!isPlaying && (
          <FloatingNavigation
            onPrevious={() => handleNavigate('prev')}
            onNext={() => handleNavigate('next')}
            scrollY={scrollY}
          />
        )}

        {/* Audio Player */}
        {isPlaying && (
          <AudioPlayer
            isPlaying={isPlaying}
            progress={progress.progress}
            duration={progress.duration}
            currentTime={progress.currentTime}
            currentVerse={currentVerseIndex + 1}
            totalVerses={parsedVerses.length}
            onSeek={seekToPosition}
            onPrevious={() => playVerse(Math.max(0, currentVerseIndex - 1))}
            onNext={() => playVerse(Math.min(parsedVerses.length - 1, currentVerseIndex + 1))}
            onPlayPause={handleAudioPress}
            onDismiss={() => setIsPlayerExpanded(false)}
            isExpanded={isPlayerExpanded}
          />
        )}
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
    </GestureHandlerRootView>
  );
};

export default function BibleScreen() {
  return (
    <SafeAreaProvider>
      <VersesProvider>
        <AudioProvider>
          <Bible />
        </AudioProvider>
      </VersesProvider>
    </SafeAreaProvider>
  );
}
