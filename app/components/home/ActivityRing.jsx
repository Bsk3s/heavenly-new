import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Star } from 'lucide-react-native';

const ActivityRing = ({ activity, onClick, size: customSize, hideText = false, isCalendarView = false, date }) => {
  const { title, progress, duration, streak, color = "blue", icon: Icon } = activity;
  
  // Ring configuration
  const size = customSize || 90;
  const strokeWidth = isCalendarView ? size * 0.11 : (hideText ? size * 0.12 : size * 0.11); // Much thicker stroke for calendar
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate progress based on time spent vs goal time
  let calculatedProgress = progress;
  if (duration) {
    const parts = duration.split('/');
    if (parts.length > 1) {
      const currentPart = parts[0].trim();
      const goalPart = parts[1].trim();
      
      if (currentPart === 'Done') {
        calculatedProgress = 100;
      } else if (activity.type === 'bible') {
        const todayProgress = activity.todayProgress || 0;
        const dailyGoal = activity.dailyGoal || 1;
        calculatedProgress = Math.min((todayProgress / dailyGoal) * 100, 100);
      } else {
        const currentMinutes = parseInt(currentPart.match(/(\d+)/)?.[1] || '0', 10);
        const goalMinutes = parseInt(goalPart.match(/(\d+)/)?.[1] || '0', 10);
        if (goalMinutes > 0) {
          calculatedProgress = Math.min(Math.round((currentMinutes / goalMinutes) * 100), 100);
        }
      }
    }
  }
  
  // For calendar view, use historical data if available
  if (isCalendarView && date) {
    // TODO: Get historical data for this activity on this date
    // For now, we'll use the current progress
  }
  
  const progressOffset = circumference - (calculatedProgress / 100) * circumference;
  
  // Updated color mappings to match Apple Fitness exactly
  const colorMap = {
    red: {
      ring: isCalendarView ? '#FF2D55' : (hideText ? '#FF1744' : '#EF4444'),
      bg: isCalendarView ? 'rgba(255, 45, 85, 0.3)' : (hideText ? '#FFE5E5' : '#FEF2F2')
    },
    green: {
      ring: isCalendarView ? '#2CD959' : (hideText ? '#00C853' : '#10B981'),
      bg: isCalendarView ? 'rgba(44, 217, 89, 0.3)' : (hideText ? '#E8F5E9' : '#ECFDF5')
    },
    blue: {
      ring: isCalendarView ? '#2DD9FF' : (hideText ? '#2979FF' : '#3B82F6'),
      bg: isCalendarView ? 'rgba(45, 217, 255, 0.3)' : (hideText ? '#E3F2FD' : '#EFF6FF')
    },
    orange: {
      ring: isCalendarView ? '#FF9500' : (hideText ? '#FF9100' : '#F59E0B'),
      bg: isCalendarView ? 'rgba(255, 149, 0, 0.3)' : (hideText ? '#FFF3E0' : '#FFFBEB')
    },
    purple: {
      ring: isCalendarView ? '#BF5AF2' : (hideText ? '#AA00FF' : '#8B5CF6'),
      bg: isCalendarView ? 'rgba(191, 90, 242, 0.3)' : (hideText ? '#F3E5F5' : '#F5F3FF')
    }
  };
  
  const colors = colorMap[color] || colorMap.blue;
  
  // Format duration for display
  const formatDuration = (durationText) => {
    if (!durationText) return '';
    if (activity.type === 'bible') {
      return `${activity.todayProgress || 0}/${activity.dailyGoal || 1} chapters`;
    }
    const parts = durationText.split('/');
    if (parts.length < 2) return durationText;
    if (parts[0].trim() === 'Done') return 'Complete';
    const current = parts[0].trim().match(/(\d+)/)?.[1] || '0';
    const goal = parts[1].trim().match(/(\d+)/)?.[1] || '0';
    return `${current}m / ${goal}m`;
  };

  return (
    <View style={{ width: hideText ? size : size * 1.11, alignItems: 'center' }}>
      <View className="relative">
        <Svg width={size} height={size}>
          {/* Background circle with darker opacity */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.bg}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={1} // Full opacity for better visibility
          />
          
          {/* Progress circle with sharp edges */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="butt"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
            fill="none"
          />
          
          {/* Progress end dot - larger for better visibility */}
          {calculatedProgress > 0 && calculatedProgress < 100 && isCalendarView && (
            <Circle
              cx={size / 2 + radius * Math.cos((calculatedProgress / 100 * 2 * Math.PI) - Math.PI / 2)}
              cy={size / 2 + radius * Math.sin((calculatedProgress / 100 * 2 * Math.PI) - Math.PI / 2)}
              r={strokeWidth / 1.8} // Larger dot
              fill={colors.ring}
            />
          )}
        </Svg>
        
        {!hideText && (
          <>
            {/* Icon Circle */}
            <TouchableOpacity 
              onPress={onClick}
              className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center"
            >
              <View 
                className="rounded-full items-center justify-center"
                style={{ 
                  backgroundColor: colors.bg,
                  width: size * 0.64,
                  height: size * 0.64,
                }}
              >
                <Icon stroke={colors.ring} size={size * 0.29} strokeWidth={2} />
              </View>
            </TouchableOpacity>
            
            {/* Streak Badge */}
            {streak > 0 && (
              <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-1 rounded-full absolute -bottom-1 -right-1">
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-sm text-amber-600 font-medium">{streak}d</Text>
              </View>
            )}
          </>
        )}
      </View>
      
      {/* Title and Duration Text */}
      {!hideText && (
        <>
          <Text 
            className="text-center font-medium mt-2 w-full" 
            numberOfLines={1}
            style={{ fontSize: size * 0.16 }}
          >
            {title}
          </Text>
          <Text 
            className="text-gray-500 text-center w-full"
            style={{ fontSize: size * 0.13 }}
          >
            {formatDuration(duration)}
          </Text>
          <Text 
            className="text-gray-400 text-center w-full"
            style={{ fontSize: size * 0.13 }}
          >
            {streak > 0 ? `${streak} day streak` : 'No streak yet'}
          </Text>
        </>
      )}
    </View>
  );
};

export default ActivityRing;
