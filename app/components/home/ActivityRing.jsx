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
  // Better balanced stroke width - not too thin, not too thick
  const strokeWidth = isCalendarView ? size * 0.11 : (hideText ? size * 0.15 : size * 0.13);
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
  
  // For calendar view, use the progress passed directly to the component
  // This ensures the dummy data we generate is displayed
  if (isCalendarView) {
    // Use the progress value passed directly to the component
    calculatedProgress = progress;
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
  
  // Professional, high-contrast colors with optimal opacity
  const colorMap = {
    rose: {
      ring: '#ff2d55', // Apple's vibrant red
      bg: isCalendarView ? 'rgba(255, 45, 85, 0.1)' : '#fff1f2',
      inactiveRing: 'rgba(255, 45, 85, 0.1)'
    },
    blue: {
      ring: '#0a84ff', // Apple's system blue
      bg: isCalendarView ? 'rgba(10, 132, 255, 0.1)' : '#dbeafe',
      inactiveRing: 'rgba(10, 132, 255, 0.1)'
    },
    amber: {
      ring: '#ffcc00', // Apple's yellow
      bg: isCalendarView ? 'rgba(255, 204, 0, 0.1)' : '#fffbeb',
      inactiveRing: 'rgba(255, 204, 0, 0.1)'
    },
    indigo: {
      ring: '#bf5af2', // Apple's system purple
      bg: isCalendarView ? 'rgba(191, 90, 242, 0.1)' : '#eef2ff',
      inactiveRing: 'rgba(191, 90, 242, 0.1)'
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

  // Determine if this is an empty/inactive ring for calendar view
  const isEmptyRing = isCalendarView && calculatedProgress <= 0;

  return (
    <View style={{ width: hideText ? size : size * 1.11, alignItems: 'center' }}>
      <View className="relative">
        <Svg width={size} height={size}>
          {/* Background circle with better visibility */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.inactiveRing}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="butt"
          />
          
          {/* Progress circle with better visibility */}
          {calculatedProgress > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.ring}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference}`}
              strokeDashoffset={progressOffset}
              strokeLinecap="butt"
              transform={`rotate(-90, ${size / 2}, ${size / 2})`}
              fill="none"
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
