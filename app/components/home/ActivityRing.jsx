import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Star } from 'lucide-react-native';

const ActivityRing = ({ activity, onClick, size: customSize, hideText = false, isCalendarView = false, date, color: propColor }) => {
  const { title, progress, duration, streak, color: activityColor = "blue", icon: Icon } = activity;
  
  // Use propColor if provided, otherwise fall back to activityColor
  const color = propColor || activityColor;
  
  // Ring configuration
  const size = customSize || 90;
  const strokeWidth = isCalendarView ? size * 0.11 : (hideText ? size * 0.12 : size * 0.11);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate progress based on time spent vs goal time
  let calculatedProgress = progress;
  
  // Handle Bible reading progress first
  if (activity.type === 'bible') {
    const todayProgress = activity.todayProgress || 0;
    calculatedProgress = todayProgress > 0 ? 100 : 0;
  }
  // Handle other duration-based activities
  else if (duration) {
    const parts = duration.split('/');
    if (parts.length > 1) {
      const currentPart = parts[0].trim();
      const goalPart = parts[1].trim();
      
      if (currentPart === 'Done') {
        calculatedProgress = 100;
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
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (!isToday) {
      // For past dates, show empty ring if no data
      calculatedProgress = activity.historicalProgress?.[date.toISOString()] ?? 0;
    }
  }
  
  const progressOffset = circumference - (calculatedProgress / 100) * circumference;
  
  // Map legacy color names to new color names
  const colorNameMap = {
    'red': 'rose',
    'orange': 'amber',
    'purple': 'indigo'
  };

  // Convert legacy color names to new color names
  const normalizedColorName = colorNameMap[color] || color;
  
  // Updated color mappings to match Tailwind colors
  const colorMap = {
    rose: {
      ring: isCalendarView ? '#f43f5e' : '#f43f5e',
      bg: isCalendarView ? 'rgba(244, 63, 94, 0.3)' : '#fff1f2'
    },
    blue: {
      ring: isCalendarView ? '#60a5fa' : '#60a5fa',
      bg: isCalendarView ? 'rgba(96, 165, 250, 0.3)' : '#dbeafe'
    },
    amber: {
      ring: isCalendarView ? '#f59e0b' : '#f59e0b',
      bg: isCalendarView ? 'rgba(245, 158, 11, 0.3)' : '#fffbeb'
    },
    indigo: {
      ring: isCalendarView ? '#6366f1' : '#6366f1',
      bg: isCalendarView ? 'rgba(99, 102, 241, 0.3)' : '#eef2ff'
    }
  };
  
  // Use the activity's color or fallback to blue
  const colors = colorMap[normalizedColorName] || colorMap.blue;
  
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
              <View 
                className="flex-row items-center gap-1 px-2 py-1 rounded-full absolute -bottom-1 -right-1"
                style={{ backgroundColor: colors.bg }}
              >
                <Star size={12} color={colors.ring} fill={colors.ring} />
                <Text 
                  className="text-xs font-medium"
                  style={{ color: colors.ring }}
                >
                  {streak}d
                </Text>
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
