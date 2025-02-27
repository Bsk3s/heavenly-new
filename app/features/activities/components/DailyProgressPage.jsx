import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ArrowLeft, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import ActivityRing from '../../../components/home/ActivityRing';
import ActivityModal from './ActivityModal';
import useActivities from '../hooks/useActivities';
import CustomCalendar from '../../../components/calendar/CustomCalendar';

// Time view selector component
const TimeViewSelector = ({ timeView, onViewChange }) => (
  <View className="flex-row justify-center gap-2 mb-4">
    {['day', 'week', 'month'].map((view) => (
      <TouchableOpacity
        key={view}
        onPress={() => onViewChange(view)}
        className={`px-4 py-1.5 rounded-full ${
          timeView === view ? 'bg-gray-900' : 'bg-gray-100'
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            timeView === view ? 'text-white' : 'text-gray-600'
          }`}
        >
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// Week view component with activity tracking
const WeekView = ({ weeklyData, activities }) => (
  <View className="mt-6 bg-gray-50 rounded-xl p-4">
    <View className="flex-row items-center justify-between mb-4">
      <TouchableOpacity className="p-1">
        <ChevronLeft size={20} color="#9CA3AF" />
      </TouchableOpacity>
      <Text className="text-sm font-medium text-gray-800">This Week</Text>
      <TouchableOpacity className="p-1">
        <ChevronRight size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
    <View className="flex-row justify-between">
      {weeklyData.map((day, idx) => (
        <View key={idx} className="items-center">
          <Text className="text-xs text-gray-500 mb-2">{day.date}</Text>
          <View className="space-y-1">
            {activities.map((activity) => (
              <View
                key={activity.id}
                className="h-1.5 w-6 rounded-full"
                style={{
                  backgroundColor: day.completed.includes(activity.id)
                    ? activity.color === 'red' ? '#EF4444' 
                    : activity.color === 'blue' ? '#3B82F6'
                    : activity.color === 'orange' ? '#F59E0B'
                    : '#8B5CF6'
                    : '#E5E7EB'
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  </View>
);

// Helper function to get color values based on activity color
const getColorForActivity = (colorName) => {
  // Map legacy color names to new color names
  const colorNameMap = {
    'red': 'rose',
    'orange': 'amber',
    'purple': 'indigo'
  };

  // Convert legacy color names to new color names
  const normalizedColorName = colorNameMap[colorName] || colorName;
  
  const colorMap = {
    rose: { 
      bg: '#fff1f2',
      text: '#f43f5e',
      ring: '#f43f5e',
      streakBg: '#fff1f2'
    },
    blue: { 
      bg: '#dbeafe',
      text: '#60a5fa',
      ring: '#60a5fa',
      streakBg: '#dbeafe'
    },
    amber: { 
      bg: '#fffbeb',
      text: '#f59e0b',
      ring: '#f59e0b',
      streakBg: '#fffbeb'
    },
    indigo: { 
      bg: '#eef2ff',
      text: '#6366f1',
      ring: '#6366f1',
      streakBg: '#eef2ff'
    }
  };
  return colorMap[normalizedColorName] || colorMap.blue;
};

// Month view component with calendar and activity rings
const MonthView = React.memo(({ activities }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(2025, 1, 1); // February 2025
  });
  
  const screenWidth = Dimensions.get('window').width;
  const ringSize = 36; // Slightly larger rings for better visibility
  
  // Format date to YYYY-MM-DD for the calendar
  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Custom day component with activity rings
  const renderDay = useCallback((day) => {
    // If the day is from another month or null, render empty
    if (day.state === 'disabled' || !day.date) {
      return <View style={{ width: ringSize * 1.5, height: ringSize * 2 }} />;
    }
    
    const dateObj = new Date(day.date.timestamp);
    const isToday = dateObj.toDateString() === new Date().toDateString();
    
    // Check if it's the first day of the month to show month name
    const isFirstDay = day.date.day === 1;
    
    // Get month abbreviation in a more consistent way
    const monthAbbr = isFirstDay ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dateObj.getMonth()] : '';
    
    return (
      <View style={{ 
        width: ringSize * 1.5, 
        height: ringSize * 2,
        alignItems: 'center',
        paddingTop: 2,
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 16,
          marginBottom: 4,
        }}>
          <Text 
            style={{ 
              fontSize: 11,
              fontWeight: isToday ? 'bold' : 'normal',
              color: isToday ? '#000' : '#666',
            }}
          >
            {day.date.day}
          </Text>
          {isFirstDay && (
            <Text 
              style={{ 
                fontSize: 11,
                fontWeight: 'bold',
                color: '#000',
                marginLeft: 2,
              }}
            >
              {' ' + monthAbbr}
            </Text>
          )}
        </View>
        
        <View style={{ 
          width: ringSize, 
          height: ringSize,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}>
          {/* Render activity rings from largest to smallest */}
          {activities.map((activity, idx) => {
            // Calculate progress for this activity on this date
            const today = new Date();
            const isCurrentDay = dateObj.toDateString() === today.toDateString();
            
            let progress = 0;
            
            // For past dates, use historical data if available
            if (!isCurrentDay && activity.historicalProgress) {
              progress = activity.historicalProgress[formatDate(dateObj)] ?? 0;
            } else {
              // For today or if no historical data, calculate based on activity type
              if (activity.type === 'prayer') progress = 100;
              else if (activity.type === 'bible') progress = activity.todayProgress > 0 ? 100 : 0;
              else progress = activity.progress || 0;
            }
            
            // Calculate scale factor based on index (smaller for each subsequent ring)
            const scaleFactor = 1 - (idx * 0.15);
            
            return (
              <View
                key={activity.id}
                style={{
                  position: 'absolute',
                  width: ringSize,
                  height: ringSize,
                  transform: [{ scale: scaleFactor }],
                  left: 0,
                  top: 0,
                }}
              >
                <ActivityRing
                  activity={{
                    ...activity,
                    progress: progress
                  }}
                  size={ringSize}
                  hideText={true}
                  isCalendarView={true}
                  date={dateObj}
                  color={activity.color}
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  }, [activities, ringSize]);
  
  // Handle month change
  const handleMonthChange = (month) => {
    const newDate = new Date(month.year, month.month - 1, 1);
    setCurrentMonth(newDate);
  };
  
  return (
    <View className="mt-2 bg-white rounded-xl overflow-hidden">
      <CustomCalendar
        initialDate={currentMonth}
        renderDay={renderDay}
        onMonthChange={handleMonthChange}
        calendarStyle={{ 
          borderRadius: 12,
          backgroundColor: '#ffffff',
        }}
      />
    </View>
  );
});

const DailyProgressPage = ({ onBack }) => {
  const [timeView, setTimeView] = useState('month');
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  const { 
    activities, 
    updateProgress, 
    addTime, 
    startTimer, 
    getWeeklyData 
  } = useActivities();
  
  // Add debug log for activities
  useEffect(() => {
    console.log('Activities loaded:', activities.map(a => ({
      title: a.title,
      type: a.type,
      progress: a.progress
    })));
  }, [activities]);

  // Add debug log for activity selection
  const handleActivitySelect = (activity) => {
    console.log('Selecting activity:', {
      title: activity.title,
      type: activity.type,
      progress: activity.progress
    });
    setSelectedActivity(activity);
  };
  
  // Get weekly data for the calendar view
  const weeklyData = getWeeklyData();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity 
          onPress={onBack}
          className="p-2 mr-2"
        >
          <ArrowLeft size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold">Daily Progress</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <TimeViewSelector 
          timeView={timeView} 
          onViewChange={setTimeView} 
        />
        
        {timeView === 'day' ? (
          <View className="mt-4">
            {/* Grid layout for activity rings */}
            <View className="flex-row flex-wrap">
              {activities.map((activity, index) => (
                <View 
                  key={activity.id} 
                  className={`w-1/2 mb-8 ${
                    index % 2 === 0 ? 'pr-2' : 'pl-2'
                  }`}
                >
                  <View className="items-center">
                    <ActivityRing
                      activity={activity}
                      onClick={() => handleActivitySelect(activity)}
                      size={120} // Larger ring size
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : timeView === 'week' ? (
          <WeekView weeklyData={weeklyData} activities={activities} />
        ) : (
          <MonthView activities={activities} />
        )}

        <View className="mt-8 space-y-6">
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-lg font-medium mb-4">Activity Summary</Text>
            <View className="space-y-4">
              {activities.map((activity) => {
                const colors = getColorForActivity(activity.color);
                
                return (
                  <TouchableOpacity 
                    key={activity.id} 
                    className="flex-row items-center justify-between bg-white p-3 rounded-lg"
                    onPress={() => handleActivitySelect(activity)}
                  >
                    <View className="flex-row items-center gap-3">
                      <View 
                        className="p-2.5 rounded-full" 
                        style={{ backgroundColor: getColorForActivity(activity.color).bg }}
                      >
                        <activity.icon 
                          size={22} 
                          color={getColorForActivity(activity.color).text}
                        />
                      </View>
                      <View>
                        <Text className="font-semibold text-gray-800 text-base">
                          {activity.title}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {activity.type === 'prayer' ? 'Complete' :
                           activity.type === 'bible' ? `${activity.todayProgress || 20}/${activity.dailyGoal || 1} chapters` :
                           `${activity.duration || '0m'}/${activity.targetDuration || '10m'}`}
                        </Text>
                      </View>
                    </View>
                    {activity.streak > 0 && (
                      <View 
                        className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                        style={{ backgroundColor: getColorForActivity(activity.color).streakBg }}
                      >
                        <Star size={16} color={getColorForActivity(activity.color).text} fill={getColorForActivity(activity.color).text} />
                        <Text 
                          className="text-sm"
                          style={{ color: getColorForActivity(activity.color).text }}
                        >
                          {activity.streak}d
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-lg font-medium mb-4">Today's Stats</Text>
            <View className="flex-row gap-4">
              <View className="flex-1 bg-white rounded-lg p-4">
                <Text className="text-sm text-gray-600 mb-1">Completed</Text>
                <Text className="text-xl font-semibold text-gray-800">
                  {activities.filter(a => Math.round(a.progress) >= 100).length}/{activities.length}
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-lg p-4">
                <Text className="text-sm text-gray-600 mb-1">Streak</Text>
                <Text className="text-xl font-semibold text-gray-800">
                  {Math.max(...activities.map(a => a.streak || 0))}d
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Activity Modal */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onUpdateProgress={updateProgress}
          onAddTime={addTime}
          onStartTimer={startTimer}
        />
      )}
    </View>
  );
};

export default DailyProgressPage; 