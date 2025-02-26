import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ArrowLeft, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import ActivityRing from '../../../components/home/ActivityRing';
import ActivityModal from './ActivityModal';
import useActivities from '../hooks/useActivities';

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
  const colorMap = {
    red: { bg: '#FEF2F2', text: '#EF4444' },
    blue: { bg: '#EFF6FF', text: '#3B82F6' },
    orange: { bg: '#FFFBEB', text: '#F59E0B' },
    purple: { bg: '#F5F3FF', text: '#8B5CF6' }
  };
  return colorMap[colorName] || colorMap.blue;
};

// Month view component with calendar and activity rings
const MonthView = ({ activities }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const screenWidth = Dimensions.get('window').width;
  const padding = 16;
  const daySize = Math.floor((screenWidth - (padding * 2)) / 7); // Ensure whole number
  const ringSize = Math.floor(daySize * 0.82); // Larger rings (82% of cell)
  
  // Update view every minute for real-time changes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMonth(new Date(currentMonth)); // Force refresh
    }, 60000); // Every minute
    return () => clearInterval(timer);
  }, [currentMonth]);

  // Get current date for highlighting
  const today = new Date();
  const isToday = (date) => {
    return date && 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Month label (e.g., "Feb", "Mar")
  const getMonthLabel = (date) => {
    return date.toLocaleString('default', { month: 'short' });
  };

  // Check if date is first of month
  const isFirstOfMonth = (date) => {
    return date && date.getDate() === 1;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const formatMonthYear = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const days = [];
  const totalDays = Math.ceil((daysInMonth + startingDay) / 7) * 7;

  // Generate calendar days
  for (let i = 0; i < totalDays; i++) {
    const dayNumber = i - startingDay + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    const isPastDay = isCurrentMonth && isDateInPast(date);

    days.push({
      number: isCurrentMonth ? dayNumber : '',
      isCurrentMonth,
      isPastDay,
      date: isCurrentMonth ? date : null
    });
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View className="mt-2 bg-white">
      {/* Month header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-[22px] font-semibold text-gray-900">{formatMonthYear(currentMonth)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
          <ChevronRight size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Calendar container */}
      <View style={{ paddingHorizontal: padding }}>
        {/* Week days header */}
        <View className="flex-row mb-1">
          {weekDays.map((day, index) => (
            <View 
              key={index} 
              style={{ 
                width: daySize,
                alignItems: 'center',
                paddingBottom: 8, // Consistent spacing to date numbers
              }}
            >
              <Text className="text-[12px] font-normal text-gray-500">{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View className="flex-row flex-wrap">
          {days.map((day, index) => {
            const isMonthStart = isFirstOfMonth(day.date);
            const highlightToday = isToday(day.date);
            const isFutureDate = day.date && day.date > today;
            
            return (
              <View
                key={index}
                style={{ 
                  width: daySize,
                  height: daySize * 1.25, // Slightly shorter for better spacing
                  paddingTop: 2,
                  paddingBottom: 2,
                }}
                className="items-center relative"
              >
                {/* Month label */}
                {isMonthStart && (
                  <Text className="text-[12px] font-medium text-gray-900 absolute -top-7 left-0">
                    {getMonthLabel(day.date)}
                  </Text>
                )}
                
                {day.number !== '' && (
                  <>
                    {/* Date number */}
                    <View 
                      style={{
                        width: 28,
                        height: 28,
                        marginBottom: 2,
                      }}
                      className={`items-center justify-center ${
                        highlightToday ? 'bg-rose-500 rounded-full' : ''
                      }`}
                    >
                      <Text 
                        className={`text-[15px] font-normal ${
                          !day.isCurrentMonth ? 'text-gray-300' :
                          highlightToday ? 'text-white' :
                          isFutureDate ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {day.number}
                      </Text>
                    </View>

                    {/* Activity rings - only show for past and current days */}
                    {!isFutureDate && (
                      <View 
                        style={{ 
                          width: ringSize,
                          height: ringSize,
                          marginTop: 1,
                        }}
                        className="items-center justify-center"
                      >
                        {activities.map((activity, idx) => (
                          <View
                            key={activity.id}
                            className="absolute"
                            style={{
                              width: '100%',
                              height: '100%',
                              transform: [{ scale: 1 - idx * 0.06 }], // More spacing between rings
                            }}
                          >
                            <ActivityRing
                              activity={activity}
                              size={ringSize}
                              hideText={true}
                              isCalendarView={true}
                              date={day.date}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

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
                
                // Format the progress display
                const formatProgress = () => {
                  if (activity.type === 'bible') {
                    return `${activity.todayProgress || 0}/${activity.dailyGoal || 1}`;
                  }
                  return `${Math.round(activity.progress)}%`;
                };

                // Format the duration/status display
                const formatStatus = () => {
                  if (activity.type === 'bible') {
                    return 'chapters';
                  }
                  if (activity.duration?.includes('Done')) {
                    return 'Complete';
                  }
                  const parts = activity.duration?.split('/') || [];
                  if (parts.length === 2) {
                    const current = parts[0].trim().match(/(\d+)/)?.[1] || '0';
                    const goal = parts[1].trim().match(/(\d+)/)?.[1] || '0';
                    return `${current}/${goal} mins`;
                  }
                  return activity.duration || '0 mins';
                };

                return (
                  <TouchableOpacity 
                    key={activity.id} 
                    className="flex-row items-center justify-between bg-white p-3 rounded-lg"
                    onPress={() => handleActivitySelect(activity)}
                  >
                    <View className="flex-row items-center gap-3">
                      <View 
                        className="p-2.5 rounded-full" 
                        style={{ backgroundColor: colors.bg }}
                      >
                        <activity.icon 
                          size={22} 
                          color={colors.text}
                        />
                      </View>
                      <View>
                        <Text className="font-semibold text-gray-800 text-base">{activity.title}</Text>
                        <Text className="text-sm text-gray-500">
                          {formatProgress()} {formatStatus()}
                        </Text>
                      </View>
                    </View>
                    {activity.streak > 0 && (
                      <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text className="text-sm text-amber-600 font-medium">{activity.streak}d</Text>
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