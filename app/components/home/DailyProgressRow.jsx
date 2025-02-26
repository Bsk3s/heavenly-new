import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import ActivityRing from './ActivityRing';

const DailyProgressRow = ({ activities, onActivitySelect, onViewAll }) => {
  // Ensure all activities have their streaks properly set
  const activitiesWithStreaks = activities.map(activity => {
    // Preserve the original streak value, ensuring it's a valid number
    const streak = typeof activity.streak === 'number' ? activity.streak : 0;
    return { ...activity, streak };
  });

  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-semibold">Daily Progress</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text className="text-blue-500 text-sm font-medium">View All</Text>
        </TouchableOpacity>
      </View>
      
      {/* Use ScrollView to handle potential overflow on smaller screens */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View className="flex-row space-x-6">
          {activitiesWithStreaks.map((activity) => (
            <ActivityRing
              key={activity.id}
              activity={activity}
              onClick={() => onActivitySelect(activity)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default DailyProgressRow; 