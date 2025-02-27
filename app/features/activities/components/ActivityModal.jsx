import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Animated, PanResponder, SafeAreaView, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { X, Play, Clock, Star, Pause, Check, XCircle, BookOpen, ChevronDown } from 'lucide-react-native';

// Bible books structure
const BIBLE_BOOKS = {
  'Old Testament': {
    'Genesis': 50,
    'Exodus': 40,
    'Leviticus': 27,
    'Numbers': 36,
    'Deuteronomy': 34,
    'Joshua': 24,
    'Judges': 21,
    'Ruth': 4,
    '1 Samuel': 31,
    '2 Samuel': 24,
  },
  'New Testament': {
    'Matthew': 28,
    'Mark': 16,
    'Luke': 24,
    'John': 21,
    'Acts': 28,
    'Romans': 16,
  }
};

const ActivityModal = ({ activity, onClose, onUpdateProgress, onAddTime, onStartTimer }) => {
  const [selectedTestament, setSelectedTestament] = useState('New Testament');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [sliderValue, setSliderValue] = useState(activity?.progress || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimerControls, setShowTimerControls] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOverallProgress, setShowOverallProgress] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Pan responder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        // Light impact when starting to drag
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
          // Add haptic feedback at certain thresholds
          if (gestureState.dy > 100) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Heavy impact when dismissing
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          closeModal();
        } else {
          // Light impact when snapping back
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Snap back to original position
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;
  
  // Reset slider value when activity changes
  useEffect(() => {
    if (activity) {
      setSliderValue(activity.progress);
      // Start entrance animation
      slideAnim.setValue(300);
      backdropOpacity.setValue(0);
      
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activity, slideAnim, backdropOpacity]);

  // Add debugging logs
  useEffect(() => {
    if (activity) {
      console.log('Activity opened:', {
        title: activity.title,
        type: activity.type,
        progress: activity.progress,
        duration: activity.duration
      });
    }
  }, [activity]);

  // Timer functionality
  useEffect(() => {
    let interval;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Handle timer completion
  useEffect(() => {
    if (timerSeconds > 0 && timerSeconds % 60 === 0) {
      // Add a minute to the activity progress
      onAddTime(activity.id, 1);
    }
  }, [timerSeconds, activity?.id, onAddTime]);
  
  // Calculate time based on slider value
  const calculateTime = (value) => {
    if (!activity) return '0 mins';
    
    // Extract goal time in minutes
    let goalMinutes = 0;
    if (activity.duration) {
      const parts = activity.duration.split('/');
      if (parts.length > 1) {
        const goalPart = parts[1].trim();
        const match = goalPart.match(/(\d+)\s*mins/);
        if (match) {
          goalMinutes = parseInt(match[1], 10);
        }
      }
    }
    
    const minutes = Math.round((value / 100) * goalMinutes);
    return `${minutes} mins`;
  };

  const handleStartTimer = () => {
    // Add debug log
    console.log('Starting timer for:', activity.title, 'Type:', activity.type);
    
    if (!showTimerControls) {
      setShowTimerControls(true);
    }
    
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      onStartTimer(activity.id);
    }
  };

  const handleCancelTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setShowTimerControls(false);
  };

  const handleCompleteTimer = () => {
    // Calculate minutes spent
    const minutesSpent = Math.floor(timerSeconds / 60);
    if (minutesSpent > 0) {
      // Add the time to the activity
      onAddTime(activity.id, minutesSpent);
    }
    
    // Reset timer
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setShowTimerControls(false);
  };

  const handleQuickAdd = (minutes) => {
    // Add debug log
    console.log('Quick adding minutes:', minutes, 'for:', activity.title, 'Type:', activity.type);
    onAddTime(activity.id, minutes);
    setSliderValue(activity.progress);
  };

  const handleSliderComplete = () => {
    onUpdateProgress(activity.id, sliderValue);
  };
  
  const closeModal = () => {
    // Run exit animation before closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activity) return null;

  // Get the appropriate color for the activity
  const getActivityColor = (colorName) => {
    // Map legacy color names to new color names
    const colorNameMap = {
      'red': 'rose',
      'orange': 'amber',
      'purple': 'indigo'
    };

    // Convert legacy color names to new color names
    const normalizedColorName = colorNameMap[colorName] || colorName;
    
    const colorMap = {
      rose: '#f43f5e',
      blue: '#60a5fa',
      amber: '#f59e0b',
      indigo: '#6366f1'
    };

    return colorMap[normalizedColorName] || colorMap.blue;
  };

  const activityColor = getActivityColor(activity.color);

  // Get background color for buttons and icons
  const getActivityBgColor = (colorName) => {
    // Map legacy color names to new color names
    const colorNameMap = {
      'red': 'rose',
      'orange': 'amber',
      'purple': 'indigo'
    };

    // Convert legacy color names to new color names
    const normalizedColorName = colorNameMap[colorName] || colorName;
    
    const colorMap = {
      rose: '#fff1f2',
      blue: '#dbeafe',
      amber: '#fffbeb',
      indigo: '#eef2ff'
    };

    return colorMap[normalizedColorName] || colorMap.blue;
  };

  const handleChapterPress = async (book, chapter) => {
    setSelectedChapter(chapter);
    
    // Update the selected chapter
    activity.selectedBook = book;
    activity.selectedChapter = chapter;
    
    // Initialize readChapters if it doesn't exist
    if (!activity.readChapters) {
      activity.readChapters = {};
    }
    
    // Initialize the book array if it doesn't exist
    if (!activity.readChapters[book]) {
      activity.readChapters[book] = [];
    }
    
    // Add the chapter to readChapters if it's not already there
    if (!activity.readChapters[book].includes(chapter)) {
      activity.readChapters[book].push(chapter);
    }
    
    // Mark the chapter as read
    onAddTime(activity.id, 1);

    // Show confirmation
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 1500);
  };

  const calculateOverallProgress = () => {
    let totalChapters = 0;
    let readChapters = 0;
    
    Object.entries(BIBLE_BOOKS).forEach(([testament, books]) => {
      Object.entries(books).forEach(([book, chapterCount]) => {
        totalChapters += chapterCount;
        readChapters += activity.readChapters[book]?.length || 0;
      });
    });
    
    return {
      totalChapters,
      readChapters,
      percentage: Math.round((readChapters / totalChapters) * 100)
    };
  };

  const renderOverallProgress = () => {
    const progress = calculateOverallProgress();
    
    return (
      <View className="mt-4 bg-white border border-gray-100 rounded-xl p-4">
        <View className="mb-4">
          <Text className="text-base font-medium text-gray-800 mb-2">Overall Bible Progress</Text>
          <Text className="text-sm text-gray-600">
            {progress.readChapters} of {progress.totalChapters} chapters read ({progress.percentage}%)
          </Text>
        </View>
        
        {/* Progress bar */}
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <View 
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </View>

        {/* Testament Progress */}
        <View className="mt-4 space-y-4">
          {Object.entries(BIBLE_BOOKS).map(([testament, books]) => {
            let testamentChapters = 0;
            let testamentRead = 0;
            
            Object.entries(books).forEach(([book, chapterCount]) => {
              testamentChapters += chapterCount;
              testamentRead += activity.readChapters[book]?.length || 0;
            });
            
            const testamentPercentage = Math.round((testamentRead / testamentChapters) * 100);
            
            return (
              <View key={testament}>
                <Text className="text-sm font-medium text-gray-700 mb-2">{testament}</Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-500">
                    {testamentRead} of {testamentChapters} chapters
                  </Text>
                  <Text className="text-xs text-gray-500">{testamentPercentage}%</Text>
                </View>
                <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${testamentPercentage}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderBibleReadingUI = () => {
    const today = new Date().toISOString().split('T')[0];
    const hasReadToday = activity.lastReadDate === today;
    const readChapters = activity.readChapters || {};
    const todayProgress = activity.todayProgress || 0;
    const dailyGoal = activity.dailyGoal || 1;
    
    // Calculate total chapters read
    let totalChaptersRead = 0;
    Object.values(readChapters).forEach(chapters => {
      totalChaptersRead += chapters.length;
    });
    
    // Format the subtitle text
    const getSubtitleText = () => {
      if (todayProgress === 0) {
        return "Start your daily reading";
      }
      if (todayProgress === 1) {
        return "1 chapter read today";
      }
      return `${todayProgress} chapters read today`;
    };

    // Format the streak text
    const getStreakText = () => {
      if (!activity.streak) return "";
      return `${activity.streak} day streak`;
    };

    // Combine the texts
    const displayText = [getSubtitleText(), getStreakText()]
      .filter(Boolean)
      .join(" • ");

    return (
      <View className="px-6">
        {/* Add the display text near the top */}
        <Text className="text-sm text-gray-600 mb-4">{displayText}</Text>

        {/* Confirmation Toast */}
        {showConfirmation && (
          <View className="absolute top-0 left-0 right-0 z-50 mx-6">
            <View className="bg-green-100 rounded-xl p-3 flex-row items-center justify-center">
              <Check size={16} color="#22C55E" />
              <Text className="ml-2 text-green-700 font-medium">
                {selectedBook} {selectedChapter} marked as read!
              </Text>
            </View>
          </View>
        )}

        {/* Daily Goal Section */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-600 mb-2">Today's Reading</Text>
          <View className="bg-white border border-gray-100 rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base text-gray-800">Daily Goal</Text>
              <Text className={`text-sm ${hasReadToday ? 'text-green-600' : 'text-gray-600'}`}>
                {todayProgress} of {dailyGoal} {todayProgress === 1 ? 'chapter' : 'chapters'}
              </Text>
            </View>
            {hasReadToday && todayProgress >= dailyGoal ? (
              <View className="bg-green-50 rounded-xl p-3 flex-row items-center">
                <Check size={20} color="#22C55E" />
                <Text className="ml-2 text-green-700 font-medium">
                  {todayProgress - dailyGoal > 0 
                    ? `Amazing! You've read ${todayProgress - dailyGoal} extra ${todayProgress - dailyGoal === 1 ? 'chapter' : 'chapters'} today! 🌟` 
                    : 'Daily goal complete! Great job! ✨'}
                </Text>
              </View>
            ) : (
              <View className="bg-blue-50 rounded-xl p-3">
                <Text className="text-blue-700">
                  {todayProgress > 0
                    ? `Read ${todayProgress} more ${todayProgress === 1 ? 'chapter' : 'chapters'} to reach your daily goal`
                    : "Let's start reading today! Select a book below"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Book Selection */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-600 mb-2">Select Book</Text>
          <View className="space-y-2">
            {/* Testament Selector */}
            <View className="flex-row gap-2 mb-3">
              {['Old Testament', 'New Testament'].map((testament) => (
                <TouchableOpacity
                  key={testament}
                  className={`py-2 px-4 rounded-full ${
                    selectedTestament === testament ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                  onPress={() => setSelectedTestament(testament)}
                >
                  <Text
                    className={`text-sm ${
                      selectedTestament === testament ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {testament}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Books Grid */}
            <ScrollView className="max-h-48">
              <View className="flex-row flex-wrap gap-2">
                {Object.entries(BIBLE_BOOKS[selectedTestament]).map(([book, chapters]) => {
                  const isRead = readChapters[book]?.length === chapters;
                  const isPartiallyRead = readChapters[book]?.length > 0;
                  const isLastRead = activity.lastReadBook === book;
                  
                  return (
                    <TouchableOpacity
                      key={book}
                      className={`py-2 px-4 rounded-lg ${
                        isLastRead ? 'bg-blue-100' :
                        isRead ? 'bg-green-100' : 
                        isPartiallyRead ? 'bg-green-50' :
                        'bg-gray-50'
                      }`}
                      onPress={() => setSelectedBook(book)}
                    >
                      <Text
                        className={`text-sm ${
                          isLastRead ? 'text-blue-700' :
                          isRead ? 'text-green-700' :
                          isPartiallyRead ? 'text-green-600' :
                          'text-gray-700'
                        }`}
                      >
                        {book}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Selected Book Details */}
        {selectedBook && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-600 mb-2">
              {selectedBook} 
              {readChapters[selectedBook]?.length > 0 && 
                ` (${readChapters[selectedBook].length}/${BIBLE_BOOKS[selectedTestament][selectedBook]} chapters)`
              }
            </Text>
            <View className="bg-white border border-gray-100 rounded-xl p-4">
              <View className="flex-row flex-wrap gap-2">
                {[...Array(BIBLE_BOOKS[selectedTestament][selectedBook])].map((_, i) => {
                  const chapterNum = i + 1;
                  const isRead = readChapters[selectedBook]?.includes(chapterNum);
                  const isLastRead = activity.lastReadBook === selectedBook && 
                                   activity.lastReadChapter === chapterNum;
                  
                  return (
                    <View
                      key={chapterNum}
                      className={`w-10 h-10 rounded-lg items-center justify-center ${
                        isRead ? 'bg-blue-100' : 
                        'bg-gray-50'
                      }`}
                    >
                      {isRead ? (
                        <View className="items-center justify-center">
                          <Text className="text-sm text-blue-700">
                            {chapterNum}
                          </Text>
                          <Check size={12} color="#1D4ED8" />
                        </View>
                      ) : (
                        <TouchableOpacity
                          className="w-full h-full items-center justify-center"
                          onPress={() => handleChapterPress(selectedBook, chapterNum)}
                        >
                          <Text className="text-sm text-gray-700">
                            {chapterNum}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Optional Overall Progress */}
        <TouchableOpacity 
          className="mb-6 flex-row items-center justify-between"
          onPress={() => setShowOverallProgress(!showOverallProgress)}
        >
          <Text className="text-sm font-medium text-gray-600">View Overall Progress</Text>
          <ChevronDown 
            size={16} 
            color="#6B7280" 
            style={{ 
              transform: [{ rotate: showOverallProgress ? '180deg' : '0deg' }]
            }} 
          />
        </TouchableOpacity>

        {/* Show overall progress if expanded */}
        {showOverallProgress && renderOverallProgress()}
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={!!activity}
      animationType="none"
      onRequestClose={closeModal}
    >
      <Animated.View 
        className="flex-1 bg-black/50" 
        style={{ opacity: backdropOpacity }}
      >
        <Pressable 
          className="flex-1" 
          onPress={closeModal}
        />
        
        <Animated.View 
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
          style={{ 
            transform: [{ translateY: slideAnim }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 5,
          }}
        >
          <SafeAreaView className="flex-1">
            {/* Drag handle - now with pan responder */}
            <View {...panResponder.panHandlers} className="w-full py-2">
              <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
            </View>
            
            {/* Header with activity title */}
            <View className="px-6 py-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View 
                  className="mr-3 p-2 rounded-full" 
                  style={{ backgroundColor: getActivityBgColor(activity.color) }}
                >
                  <activity.icon size={20} color={activityColor} />
                </View>
                <Text className="text-lg font-semibold text-gray-800">{activity.title}</Text>
              </View>
              <TouchableOpacity onPress={closeModal} className="p-1">
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            {/* Streak info */}
            <View className="px-6 mb-4">
              <Text className="text-sm text-gray-500">{activity.streak || 0} day streak</Text>
            </View>
            
            {/* Main content */}
            {activity.type === 'bible' ? (
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                bounces={true}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {renderBibleReadingUI()}
              </ScrollView>
            ) : (
              <ScrollView>
                {/* Timer display if active */}
                {showTimerControls && (
                  <View className="px-6 mb-6">
                    <Text className="text-4xl font-semibold text-center mb-4" style={{ color: activityColor }}>
                      {formatTime(timerSeconds)}
                    </Text>
                    
                    {/* Timer controls */}
                    <View className="flex-row justify-between">
                      <TouchableOpacity 
                        className="flex-1 py-3 items-center justify-center rounded-xl mr-2"
                        style={{ backgroundColor: '#FEE2E2' }}
                        onPress={handleCancelTimer}
                      >
                        <View className="flex-row items-center">
                          <XCircle size={18} color="#EF4444" />
                          <Text className="ml-2 text-sm font-medium text-red-600">Cancel</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        className="flex-1 py-3 items-center justify-center rounded-xl ml-2"
                        style={{ backgroundColor: '#DCFCE7' }}
                        onPress={handleCompleteTimer}
                      >
                        <View className="flex-row items-center">
                          <Check size={18} color="#22C55E" />
                          <Text className="ml-2 text-sm font-medium text-green-600">Complete</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {/* Action buttons */}
                {!showTimerControls && (
                  <View className="px-6 flex-row gap-4 mb-6">
                    <TouchableOpacity 
                      className="flex-1 py-6 items-center justify-center rounded-xl"
                      style={{ backgroundColor: getActivityBgColor(activity.color) }}
                      onPress={handleStartTimer}
                    >
                      <View className="items-center">
                        <Play size={24} color={activityColor} />
                        <Text className="mt-2 text-sm font-medium text-gray-800">
                          Start Timer
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="flex-1 py-6 items-center justify-center rounded-xl"
                      style={{ backgroundColor: getActivityBgColor(activity.color) }}
                    >
                      <View className="items-center">
                        <Clock size={24} color={activityColor} />
                        <Text className="mt-2 text-sm font-medium text-gray-800">Log Time</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Quick Add section */}
                <View className="px-6 mb-6">
                  <Text className="text-sm font-medium text-gray-600 mb-3">Quick Add</Text>
                  <View className="flex-row justify-between">
                    {[5, 10, 15, 20].map((time) => (
                      <TouchableOpacity
                        key={time}
                        className="py-2 px-4 rounded-lg"
                        style={{ backgroundColor: getActivityBgColor(activity.color) }}
                        onPress={() => handleQuickAdd(time)}
                      >
                        <Text className="text-sm" style={{ color: activityColor }}>{time} mins</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Progress slider */}
                <View className="px-6 mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-medium text-gray-800">Progress</Text>
                    <Text className="text-sm text-gray-600">{calculateTime(sliderValue)} / {activity.duration.split('/')[1].trim()}</Text>
                  </View>
                  <Slider
                    minimumValue={0}
                    maximumValue={100}
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    onSlidingComplete={handleSliderComplete}
                    minimumTrackTintColor={activityColor}
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor={activityColor}
                    style={{ height: 40 }}
                  />
                </View>
              </ScrollView>
            )}
            
            {/* Stats */}
            <View className="px-6 mb-8">
              <View className="flex-row items-center mb-3">
                <Star size={16} color={activityColor} className="mr-2" />
                <Text className="text-sm font-medium text-gray-800">Progress</Text>
              </View>
              <View className="space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Current Streak</Text>
                  <Text className="font-medium text-gray-800">{activity.streak || 0} days</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Best Streak</Text>
                  <Text className="font-medium text-gray-800">14 days</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default ActivityModal; 