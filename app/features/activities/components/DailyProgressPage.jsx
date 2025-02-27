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
  // Optimal ring size for clean appearance
  const ringSize = 38; // Slightly larger for better visibility
  
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
      return <View style={{ height: 70 }} />;
    }
    
    const dateObj = new Date(day.date.timestamp);
    const isToday = dateObj.toDateString() === new Date().toDateString();
    
    // Check if it's the first day of the month to show month name
    const isFirstDay = day.date.day === 1;
    
    // Get month abbreviation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // For the reference image, we're highlighting day 27 as the current day
    const isHighlighted = day.date.day === 27;
    
    // Generate sample data for demonstration
    // In a real app, this would come from actual user data
    const hasData = day.date.day % 3 === 0 || day.date.day % 7 === 0 || day.date.day === 27;
    
    return (
      <View style={{ 
        flex: 1,
        height: 70,
        alignItems: 'center',
      }}>
        {/* Date number with highlight for current day */}
        <View style={{
          marginBottom: 5,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: isHighlighted ? '#ff2d55' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: isHighlighted ? "#000" : "transparent",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isHighlighted ? 0.2 : 0,
          shadowRadius: 2,
          elevation: isHighlighted ? 2 : 0,
        }}>
          <Text style={{ 
            fontSize: 13,
            fontWeight: isHighlighted ? 'bold' : '500',
            color: isHighlighted ? '#ffffff' : '#333333',
          }}>
            {day.date.day}{isFirstDay ? ` ${monthNames[dateObj.getMonth()]}` : ''}
          </Text>
        </View>
        
        {/* Activity rings container */}
        <View style={{ 
          width: ringSize, 
          height: ringSize,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {activities.map((activity, idx) => {
            // Calculate progress for this activity on this date
            let progress = 0;
            
            // For demonstration, add sample data to match reference image
            if (day.date.day === 27) {
              // Current day - show different progress for each ring
              if (idx === 0) progress = 100; // First ring complete
              else if (idx === 1) progress = 75; // Second ring 75%
              else if (idx === 2) progress = 50; // Third ring 50%
            } 
            else if (day.date.day % 3 === 0) {
              // Every third day has some progress
              progress = 75 + (day.date.day % 25);
            } 
            else if (day.date.day % 7 === 0) {
              // Every seventh day has full progress
              progress = 100;
            }
            
            // Calculate scale factor based on index (smaller for each subsequent ring)
            // Using a smaller reduction factor to make inner rings more visible
            const scaleFactor = 1 - (idx * 0.14);
            
            return (
              <View
                key={activity.id}
                style={{
                  position: 'absolute',
                  width: ringSize * scaleFactor,
                  height: ringSize * scaleFactor,
                  // Add a very subtle shadow to help with ring definition
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                }}
              >
                <ActivityRing
                  activity={{
                    ...activity,
                    progress: progress
                  }}
                  size={ringSize * scaleFactor}
                  hideText={true}
                  isCalendarView={true}
                  date={dateObj}
                  color={idx === 0 ? 'rose' : idx === 1 ? 'blue' : idx === 2 ? 'amber' : 'indigo'}
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