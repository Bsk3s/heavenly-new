import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, Heart, Sun, Moon } from 'lucide-react-native';

// Bible structure with chapters and reading status
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
    // Add more books...
  },
  'New Testament': {
    'Matthew': 28,
    'Mark': 16,
    'Luke': 24,
    'John': 21,
    'Acts': 28,
    'Romans': 16,
    // Add more books...
  }
};

// Helper function to get next chapter
const getNextChapter = (currentBook, currentChapter) => {
  const books = Object.keys(BIBLE_BOOKS);
  const currentBookIndex = books.indexOf(currentBook);
  const chaptersInCurrentBook = BIBLE_BOOKS[currentBook];

  if (currentChapter < chaptersInCurrentBook) {
    return { book: currentBook, chapter: currentChapter + 1 };
  } else if (currentBookIndex < books.length - 1) {
    return { book: books[currentBookIndex + 1], chapter: 1 };
  }
  return null; // Completed the Bible
};

// Helper function to calculate book progress
const calculateBookProgress = (readingHistory) => {
  const progress = {};
  Object.keys(BIBLE_BOOKS).forEach(book => {
    const chaptersRead = readingHistory.filter(entry => entry.book === book).length;
    progress[book] = (chaptersRead / BIBLE_BOOKS[book]) * 100;
  });
  return progress;
};

// Initial activities data
const initialActivities = [
  {
    id: 1,
    icon: Heart,
    title: 'Prayer Time',
    duration: '0 mins / 15 mins',
    progress: 0,
    streak: 7,
    color: 'red'
  },
  {
    id: 2,
    icon: BookOpen,
    title: 'Bible Reading',
    duration: '1 chapter per day',
    progress: 0,
    streak: 5,
    color: 'blue',
    type: 'bible',
    lastReadBook: null,
    lastReadChapter: null,
    lastReadDate: null,
    readingHistory: [],
    dailyGoal: 1,
    todayProgress: 0,
    readChapters: {},
    selectedBook: null,
    selectedChapter: null
  },
  {
    id: 3,
    icon: Sun,
    title: 'Devotional',
    duration: '0 mins / 20 mins',
    progress: 0,
    streak: 12,
    color: 'orange'
  },
  {
    id: 4,
    icon: Moon,
    title: 'Evening Prayer',
    duration: '0 mins / 10 mins',
    progress: 0,
    streak: 1,
    color: 'purple'
  },
];

// Storage keys
const ACTIVITIES_STORAGE_KEY = '@heavenly_activities';
const HISTORY_STORAGE_KEY = '@heavenly_activity_history';

const useActivities = () => {
  const [activities, setActivities] = useState(initialActivities);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);

  // Reset all data
  const resetData = async () => {
    try {
      await AsyncStorage.removeItem(ACTIVITIES_STORAGE_KEY);
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      
      // Reset to initial state with all streaks at 0
      const resetActivities = initialActivities.map(activity => ({
        ...activity,
        streak: 0,
        progress: 0,
        duration: activity.type === 'chapter'
          ? '0 chapters / 1 chapter'
          : `0 mins / ${activity.duration.split('/')[1].trim()}`
      }));
      
      setActivities(resetActivities);
      const today = new Date().toISOString().split('T')[0];
      setHistory({ [today]: [] });
      
      console.log('Data reset successfully');
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  };

  // Load activities and history from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedActivities = await AsyncStorage.getItem(ACTIVITIES_STORAGE_KEY);
        const storedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        
        if (storedActivities) {
          const parsedActivities = JSON.parse(storedActivities);
          const activitiesWithIcons = parsedActivities.map(activity => {
            let icon;
            switch(activity.id) {
              case 1: icon = Heart; break;
              case 2: icon = BookOpen; break;
              case 3: icon = Sun; break;
              case 4: icon = Moon; break;
              default: icon = Heart;
            }
            
            // Find the matching initial activity
            const initialActivity = initialActivities.find(a => a.id === activity.id);
            
            // Use stored streak if it exists and is valid
            const streak = typeof activity.streak === 'number' ? activity.streak : 
                          (initialActivity ? initialActivity.streak : 0);
            
            // Preserve the activity type from initial data
            const type = initialActivity ? initialActivity.type : undefined;
            
            return { 
              ...activity, 
              icon,
              streak,
              type
            };
          });
          setActivities(activitiesWithIcons);
        } else {
          setActivities(initialActivities);
        }
        
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        } else {
          const today = new Date().toISOString().split('T')[0];
          setHistory({ [today]: [] });
        }
      } catch (error) {
        console.error('Error loading activities data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save activities to storage whenever they change
  useEffect(() => {
    const saveActivities = async () => {
      if (loading) return;
      
      try {
        const activitiesForStorage = activities.map(({ icon, ...rest }) => rest);
        await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activitiesForStorage));
      } catch (error) {
        console.error('Error saving activities:', error);
      }
    };

    saveActivities();
  }, [activities, loading]);

  // Save history to storage whenever it changes
  useEffect(() => {
    const saveHistory = async () => {
      if (loading) return;
      
      try {
        await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving activity history:', error);
      }
    };

    saveHistory();
  }, [history, loading]);

  // Check if an activity was completed today
  const isCompletedToday = (activityId) => {
    const today = new Date().toISOString().split('T')[0];
    const todayHistory = history[today] || [];
    return todayHistory.some(entry => 
      entry.activityId === activityId && entry.progress >= 100
    );
  };

  // Update activity progress
  const updateProgress = (activityId, newProgress) => {
    const wasAlreadyCompleted = isCompletedToday(activityId);
    
    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              progress: newProgress,
              duration: updateDurationText(activity, newProgress)
            } 
          : activity
      )
    );

    // Update history for today
    const today = new Date().toISOString().split('T')[0];
    setHistory(prevHistory => {
      const todayHistory = prevHistory[today] || [];
      return {
        ...prevHistory,
        [today]: [...todayHistory, { 
          activityId, 
          progress: newProgress, 
          timestamp: new Date().toISOString() 
        }]
      };
    });

    // Check if activity is completed and update streak if needed
    if (newProgress >= 100 && !wasAlreadyCompleted) {
      updateStreak(activityId);
    }
  };

  // Helper to update the duration text based on progress
  const updateDurationText = (activity, progress) => {
    // Special handling for Bible Reading
    if (activity.type === 'chapter') {
      if (progress >= 100) {
        return 'Done / 1 chapter';
      }
      return '0 chapters / 1 chapter';
    }

    // Regular time-based activities
    let goalMinutes = 0;
    let goalText = '';
    
    if (activity.duration) {
      const parts = activity.duration.split('/');
      if (parts.length > 1) {
        goalText = parts[1].trim();
        const match = goalText.match(/(\d+)\s*mins/);
        if (match) {
          goalMinutes = parseInt(match[1], 10);
        }
      }
    }
    
    if (progress >= 100) {
      return `Done / ${goalText}`;
    }
    
    const minutes = Math.round((progress / 100) * goalMinutes);
    return `${minutes} mins / ${goalText}`;
  };

  // Update streak for an activity
  const updateStreak = (activityId) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    // Check if the activity was completed yesterday
    const yesterdayHistory = history[yesterdayString] || [];
    const wasCompletedYesterday = yesterdayHistory.some(entry => 
      entry.activityId === activityId && entry.progress >= 100
    );

    // Check if completed today
    const todayHistory = history[today] || [];
    const isCompletedToday = todayHistory.some(entry => 
      entry.activityId === activityId && entry.progress >= 100
    );
    
    setActivities(prevActivities => 
      prevActivities.map(activity => {
        if (activity.id !== activityId) return activity;
        
        // Get the current streak value, defaulting to 0 if undefined
        const currentStreak = typeof activity.streak === 'number' ? activity.streak : 0;
        
        // Calculate new streak
        let newStreak;
        if (wasCompletedYesterday && isCompletedToday) {
          // If completed both yesterday and today, increment streak
          newStreak = currentStreak + 1;
        } else if (wasCompletedYesterday) {
          // If completed yesterday but not today yet, maintain streak
          newStreak = currentStreak;
        } else {
          // If not completed yesterday, start new streak at 1
          newStreak = 1;
        }
        
        // Log streak update for debugging
        console.log(`Streak update for ${activity.title}:`, {
          wasCompletedYesterday,
          isCompletedToday,
          currentStreak,
          newStreak,
          history: JSON.stringify(history)
        });
        
        return { ...activity, streak: newStreak };
      })
    );
  };

  // Add time or mark chapter as read
  const addTime = (activityId, minutes) => {
    setActivities(prevActivities => {
      return prevActivities.map(activity => {
        if (activity.id !== activityId) return activity;
        
        // Special handling for Bible Reading
        if (activity.type === 'bible') {
          const today = new Date().toISOString().split('T')[0];
          
          // Update reading history for the selected book and chapter
          const newReadChapters = { ...activity.readChapters };
          if (activity.selectedBook) {
            if (!newReadChapters[activity.selectedBook]) {
              newReadChapters[activity.selectedBook] = [];
            }
            if (!newReadChapters[activity.selectedBook].includes(activity.selectedChapter)) {
              newReadChapters[activity.selectedBook].push(activity.selectedChapter);
            }
          }

          // Calculate new progress
          const newTodayProgress = (activity.todayProgress || 0) + 1;
          const dailyGoal = activity.dailyGoal || 1;
          const newProgress = Math.min((newTodayProgress / dailyGoal) * 100, 100);

          // Update the activity
          return {
            ...activity,
            lastReadDate: today,
            todayProgress: newTodayProgress,
            readChapters: newReadChapters,
            progress: newProgress,
            // Update the duration to reflect chapters read
            duration: `${newTodayProgress}/${dailyGoal} chapters`,
            // Update streak if this is the first chapter(s) of the day
            streak: activity.lastReadDate !== today ? activity.streak + 1 : activity.streak,
            // Store which chapter was just read
            lastReadBook: activity.selectedBook,
            lastReadChapter: activity.selectedChapter
          };
        }

        // Regular time-based activities
        const parts = activity.duration.split('/');
        const currentPart = parts[0].trim();
        const goalPart = parts[1].trim();
        
        let currentMinutes = 0;
        if (currentPart !== 'Done') {
          const match = currentPart.match(/(\d+)\s*mins/);
          if (match) {
            currentMinutes = parseInt(match[1], 10);
          }
        }
        
        let goalMinutes = 0;
        const goalMatch = goalPart.match(/(\d+)\s*mins/);
        if (goalMatch) {
          goalMinutes = parseInt(goalMatch[1], 10);
        }
        
        // Add the minutes and calculate new progress
        const newMinutes = Math.min(currentMinutes + minutes, goalMinutes);
        const newProgress = Math.min(Math.round((newMinutes / goalMinutes) * 100), 100);
        
        // Update the duration text
        const newDuration = newProgress >= 100 
          ? `Done / ${goalPart}`
          : `${newMinutes} mins / ${goalPart}`;
        
        // Check if this completion should update the streak
        const wasAlreadyCompleted = isCompletedToday(activityId);
        if (newProgress >= 100 && !wasAlreadyCompleted) {
          setTimeout(() => updateStreak(activityId), 0);
        }
        
        return {
          ...activity,
          duration: newDuration,
          progress: newProgress
        };
      });
    });
    
    // Update history for today
    const today = new Date().toISOString().split('T')[0];
    setHistory(prevHistory => {
      const todayHistory = prevHistory[today] || [];
      return {
        ...prevHistory,
        [today]: [...todayHistory, { 
          activityId, 
          timestamp: new Date().toISOString() 
        }]
      };
    });
  };

  // Start a timer for an activity
  const startTimer = (activityId) => {
    // In a real app, this would start a timer and update progress in real-time
    console.log(`Starting timer for activity ${activityId}`);
    // For now, we'll just simulate adding 5 minutes
    addTime(activityId, 5);
  };

  // Get activity history for a specific date
  const getHistoryForDate = (date) => {
    return history[date] || [];
  };

  // Get weekly data for the calendar view
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weeklyData = [];
    
    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      
      // Get completed activities for this date
      const dateHistory = history[dateString] || [];
      const completedActivities = [...new Set(
        dateHistory
          .filter(entry => entry.progress >= 100)
          .map(entry => entry.activityId)
      )];
      
      weeklyData.push({
        date: dayName,
        dateString,
        completed: completedActivities
      });
    }
    
    return weeklyData;
  };

  return {
    activities,
    loading,
    updateProgress,
    addTime,
    startTimer,
    getHistoryForDate,
    getWeeklyData,
    resetData
  };
};

export default useActivities; 