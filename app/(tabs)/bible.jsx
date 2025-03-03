import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Pressable, LayoutAnimation } from 'react-native';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

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

const ProgressBar = ({ progress, onSeek }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const progressAnim = useSharedValue(progress);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (!isDragging.value) {
      progressAnim.value = withSpring(progress, { damping: 15 });
    }
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progressAnim.value * containerWidth - 8 }],
  }));

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(Haptics.selectionAsync)();
      isDragging.value = true;
    })
    .onUpdate((e) => {
      if (containerWidth === 0) return;
      const newProgress = Math.max(0, Math.min(1, e.x / containerWidth));
      progressAnim.value = newProgress;
    })
    .onEnd(() => {
      if (containerWidth === 0) return;
      runOnJS(onSeek)(progressAnim.value);
      isDragging.value = false;
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View
        ref={containerRef}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        className="h-1.5 bg-gray-200 rounded-full overflow-hidden relative"
      >
        <Animated.View
          className="absolute left-0 top-0 bottom-0 bg-blue-500 rounded-full"
          style={progressStyle}
        />
        <Animated.View
          className="absolute top-1/2 -mt-2 h-4 w-4 bg-white rounded-full shadow"
          style={knobStyle}
        />
      </View>
    </GestureDetector>
  );
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

  // Add state for progress visibility
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  
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
    stopPlayback,
    seekToPosition
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

  // Add these near other shared values
  const progressVisible = useSharedValue(0);

  // Add these near other shared values
  const pullIndicatorOpacity = useSharedValue(0);
  const pullIndicatorTranslateY = useSharedValue(0);

  // Add these near other state declarations
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedModal, setShowSpeedModal] = useState(false);

  // Add speed options
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
      context.startX = event.absoluteX;
      context.startProgress = sliderProgress.value;
      isDragging.value = true;
      runOnJS(pausePlayback)();
      runOnJS(Haptics.selectionAsync)();
    },
    onActive: (event, context) => {
      if (sliderWidth.value === 0) return;

      const delta = event.absoluteX - context.startX;
      const progressDelta = delta / sliderWidth.value;
      const newProgress = Math.max(0, Math.min(1, context.startProgress + progressDelta));

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
    await Haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    discussVerse(verseId);
  };
  
  // Update the audio press handler
  const handleAudioPress = useCallback(async () => {
    try {
      if (isAudioProcessing) return;

      // Ensure we're in a consistent state before proceeding
      const currentPlayingState = isPlaying;
      
      if (!isProgressVisible) {
        // If player is hidden, show it first
        setIsProgressVisible(true);
        playerTranslateY.value = withSpring(0, playerSpringConfig);
        playerOpacity.value = withSpring(1, playerSpringConfig);
        
        // Small delay to ensure animations are started
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (currentPlayingState) {
        // If currently playing, pause first
        await pausePlayback();
        
        // Double check the pause was successful
        if (isPlaying) {
          console.warn('Pause operation did not complete successfully');
          await TextToSpeech.stop(); // Force stop as fallback
          setIsPlaying(false);
        }
      } else {
        if (currentVerseIndex === -1) {
          await playVerse(0);
        } else {
          await resumePlayback();
        }
      }
    } catch (err) {
      console.error('Error handling audio press:', err);
      // Ensure we're in a stopped state if there's an error
      await TextToSpeech.stop();
      setIsPlaying(false);
      setError('Failed to control audio playback');
    }
  }, [isAudioProcessing, isPlaying, currentVerseIndex, isProgressVisible, pausePlayback, playVerse, resumePlayback]);

  // Handle audio retry
  const handleAudioRetry = useCallback(async () => {
    await stopPlayback();
    await new Promise(resolve => setTimeout(resolve, 500)); // Add small delay
    await playVerse(currentVerseIndex);
  }, [currentVerseIndex, stopPlayback, playVerse]);

  // Handle audio seek
  const handleSeek = useCallback(async (newProgress) => {
    try {
      await seekToPosition(newProgress);
    } catch (err) {
      console.error('Error handling seek:', err);
    }
  }, [seekToPosition]);
  
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

  // Add shared value for progress section position
  const progressTranslateY = useSharedValue(0);
  const lastProgressPosition = useSharedValue(0);

  // Add gesture handler for progress section
  const progressPanGesture = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = progressTranslateY.value;
    },
    onActive: (event, context) => {
      // Calculate new position with boundaries
      const newPosition = context.startY + event.translationY;
      // Limit the movement between hidden (-100) and fully visible (0)
      progressTranslateY.value = Math.max(-100, Math.min(0, newPosition));
    },
    onEnd: () => {
      // Snap to nearest position (top or bottom)
      const shouldHide = progressTranslateY.value < -50;
      progressTranslateY.value = withSpring(
        shouldHide ? -100 : 0,
        { damping: 20, stiffness: 90 }
      );
      lastProgressPosition.value = shouldHide ? -100 : 0;
    },
  });

  // Add animated style for progress section
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progressTranslateY.value }],
  }));

  // Add this new gesture handler for the progress section
  const progressGesture = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = progressVisible.value;
    },
    onActive: (event, context) => {
      const newValue = context.startY + event.translationY / 100;
      progressVisible.value = Math.max(0, Math.min(1, newValue));
    },
    onEnd: () => {
      if (progressVisible.value < 0.5) {
        progressVisible.value = withSpring(0);
        runOnJS(setIsProgressVisible)(false);
      } else {
        progressVisible.value = withSpring(1);
      }
    },
  });

  // Add this new animated style
  const progressStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progressVisible.value,
      [0, 1],
      [-100, 0]
    );

    return {
      transform: [{ translateY }],
      opacity: progressVisible.value,
    };
  });

  // Add this before the return statement, with other hooks
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = progressTranslateY.value;
    },
    onActive: (event, context) => {
      progressTranslateY.value = Math.max(-200, Math.min(0, context.startY + event.translationY));
    },
    onEnd: (event) => {
      const shouldExpand = event.velocityY < 0 || progressTranslateY.value < -100;
      progressTranslateY.value = withSpring(
        shouldExpand ? -200 : 0,
        { damping: 15, stiffness: 90 }
      );
      runOnJS(setIsProgressVisible)(shouldExpand);
    },
  });

  // Add these near other shared values
  const playerTranslateY = useSharedValue(0);
  const playerOpacity = useSharedValue(1);

  const playerSpringConfig = {
    damping: 15,
    stiffness: 90
  };

  // Simplify the player gesture handler
  const playerGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = playerTranslateY.value;
    },
    onActive: (event, context) => {
      // Only allow upward movement
      const newY = Math.min(0, context.startY + event.translationY);
      playerTranslateY.value = newY;
      playerOpacity.value = 1 + (newY / 200); // Fade out as it moves up
    },
    onEnd: (event) => {
      const velocity = event.velocityY;
      const position = playerTranslateY.value;
      
      // Dismiss if swiped up with velocity or past threshold
      if (velocity < -500 || position < -50) {
        playerTranslateY.value = withSpring(-200, playerSpringConfig);
        playerOpacity.value = withTiming(0, {}, () => {
          runOnJS(setIsProgressVisible)(false);
        });
      } else {
        // Return to original position
        playerTranslateY.value = withSpring(0, playerSpringConfig);
        playerOpacity.value = withSpring(1, playerSpringConfig);
      }
    },
  });

  // Add this effect to handle smooth layout transitions
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isProgressVisible]);

  // Replace the showPlayerGesture handler
  const showPlayerGesture = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startY = event.absoluteY;
      // Only allow showing if we're at the top of the scroll and player is hidden
      context.canShow = scrollY.value < 50 && !isProgressVisible;
    },
    onActive: (event, context) => {
      if (!context.canShow) return;
      
      const deltaY = event.absoluteY - context.startY;
      if (deltaY > 20) { // Small threshold to start showing
        runOnJS(setIsProgressVisible)(true);
        playerTranslateY.value = withSpring(0, playerSpringConfig);
        playerOpacity.value = withSpring(1, playerSpringConfig);
        context.canShow = false;
      }
    },
  });

  // Add this style for the pull indicator
  const pullIndicatorStyle = useAnimatedStyle(() => ({
    opacity: pullIndicatorOpacity.value,
    transform: [{ translateY: pullIndicatorTranslateY.value }],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        
        {/* Pull Indicator */}
        <Animated.View 
          style={[{
            position: 'absolute',
            top: 100,
            left: 0,
            right: 0,
            zIndex: 1000,
            alignItems: 'center',
            paddingVertical: 10,
          }, pullIndicatorStyle]}
        >
          <View className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full">
            <Ionicons name="chevron-down" size={20} color="white" />
            <Text className="text-white ml-2 font-medium">Pull to show player</Text>
          </View>
        </Animated.View>

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
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="#666"
            />
          </BibleHeader>

          {/* Audio Progress Section */}
          {(isPlaying || isProgressVisible || (currentVerseIndex !== -1)) && (
            <PanGestureHandler onGestureEvent={playerGestureHandler}>
              <Animated.View 
                className="bg-white rounded-lg shadow-lg"
                style={[
                  {
                    position: 'absolute',
                    top: 80, // Position it below the header
                    left: HORIZONTAL_PADDING,
                    right: HORIZONTAL_PADDING,
                    zIndex: 1000,
                    transform: [{ translateY: playerTranslateY }],
                    opacity: playerOpacity,
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }
                ]}
              >
                {/* Pill Handle - Updated color */}
                <View className="w-full items-center pt-2 pb-1">
                  <View className="w-12 h-1 rounded-full bg-gray-800" />
                </View>

                <View className="px-4 pb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-gray-600">
                      {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Verse {currentVerseIndex + 1} of {parsedVerses.length}
                    </Text>
                  </View>

                  <ProgressBar
                    progress={progress.progress}
                    onSeek={handleSeek}
                  />

                  {/* New Controls Layout */}
                  <View className="flex-row items-center justify-between mt-4">
                    {/* Speed Control */}
                    <TouchableOpacity 
                      onPress={() => setShowSpeedModal(true)}
                      className="px-3 py-1 rounded-full bg-gray-100"
                    >
                      <Text className="text-sm font-medium text-gray-700">{playbackSpeed}x</Text>
                    </TouchableOpacity>

                    {/* Main Controls */}
                    <View className="flex-row items-center space-x-6">
                      <TouchableOpacity 
                        onPress={() => {/* TODO: Skip back 15s */}}
                        className="p-2"
                      >
                        <View className="relative">
                          <Ionicons name="play-back" size={24} color="#666" />
                          <Text className="absolute -bottom-4 text-xs text-gray-600 w-8 text-center">15</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleAudioPress}
                        disabled={isAudioProcessing}
                        className="p-4 bg-blue-500 rounded-full"
                      >
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={28}
                          color="white"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => {/* TODO: Skip forward 15s */}}
                        className="p-2"
                      >
                        <View className="relative">
                          <Ionicons name="play-forward" size={24} color="#666" />
                          <Text className="absolute -bottom-4 text-xs text-gray-600 w-8 text-center">15</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Repeat Control */}
                    <TouchableOpacity 
                      onPress={() => {/* TODO: Toggle repeat */}}
                      className="px-3 py-1"
                    >
                      <Ionicons name="repeat-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {audioError && (
                  <View className="flex-row items-center justify-between px-4 py-2 bg-red-50 rounded-b-lg">
                    <Text className="text-red-600 text-sm">{audioError}</Text>
                    <TouchableOpacity onPress={handleAudioRetry} className="bg-red-100 rounded-full p-2">
                      <Ionicons name="refresh" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </PanGestureHandler>
          )}

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
        
          {audioError && (
            <AudioError
              error={audioError}
              onRetry={handleAudioRetry}
              style={{ marginTop: 8, marginBottom: 4 }}
            />
          )}
        </View>

        {/* Main Content with Gesture Zones */}
        <PanGestureHandler onGestureEvent={showPlayerGesture}>
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
        </PanGestureHandler>
        
        {/* Floating Navigation */}
        {!isPlaying && (
          <FloatingNavigation
          onPrevious={() => handleNavigate('prev')}
          onNext={() => handleNavigate('next')}
            scrollY={scrollY}
          >
            <Ionicons name="chevron-back" size={24} color="#666" />
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </FloatingNavigation>
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

        {/* Speed Selection Modal */}
        <SelectionModal
          visible={showSpeedModal}
          title="Playback Speed"
          data={SPEED_OPTIONS}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setPlaybackSpeed(item);
                setShowSpeedModal(false);
                // TODO: Implement speed change in audio playback
              }}
              className={`p-4 rounded-lg mb-2 ${playbackSpeed === item ? 'bg-blue-100' : 'bg-gray-100'}`}
            >
              <Text className={`text-center font-medium ${playbackSpeed === item ? 'text-blue-600' : 'text-gray-800'}`}>
                {item}x
              </Text>
            </TouchableOpacity>
          )}
          onClose={() => setShowSpeedModal(false)}
          keyExtractor={(item) => item.toString()}
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
