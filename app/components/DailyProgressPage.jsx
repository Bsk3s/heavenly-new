import React, { useState, memo } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Star } from 'lucide-react-native';

// Time View Selector Component
const TimeViewSelector = memo(({ timeView, onViewChange }) => (
  <View className="flex flex-row justify-center gap-2 mb-4">
    {['day', 'week', 'month'].map((view) => (
      <TouchableOpacity
        key={view}
        onPress={() => onViewChange(view)}
        className={`px-4 py-1.5 rounded-full ${
          timeView === view 
            ? 'bg-gray-900' 
            : 'bg-gray-100'
        }`}
      >
        <Text className={`text-sm font-medium ${
          timeView === view 
            ? 'text-white' 
            : 'text-gray-600'
        }`}>
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
));

const DailyProgressPage = ({ onBack, activities, onActivitySelect }) => {
  const [timeView, setTimeView] = useState('day');
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex flex-row items-center p-4 bg-white border-b border-gray-100">
        <TouchableOpacity 
          onPress={onBack}
          className="p-2 rounded-full mr-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#4b5563" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold">Daily Progress</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <TimeViewSelector 
          timeView={timeView} 
          onViewChange={setTimeView} 
        />
        
        <View className="flex flex-row flex-wrap justify-between mt-4">
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              onPress={() => onActivitySelect(activity)}
              className="w-[48%] mb-4"
            >
              <View className="flex items-center">
                <View className="relative w-24 h-24">
                  {/* SVG Circle for the ring */}
                  <View className="w-full h-full">
                    {/* Background circle */}
                    <View className={`absolute inset-0 rounded-full bg-${activity.color}-100`} />
                    
                    {/* Progress circle - we'll use a View with border for simplicity */}
                    <View 
                      className={`absolute inset-0 rounded-full border-8 border-${activity.color}-500`}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 48,
                        opacity: activity.progress / 100,
                      }}
                    />
                  </View>
                  
                  <View className={`absolute inset-0 flex items-center justify-center 
                    bg-${activity.color}-50 m-6 rounded-full`}>
                    <activity.icon size={24} color={`${activity.color === 'rose' ? '#f43f5e' : 
                                                     activity.color === 'blue' ? '#3b82f6' : 
                                                     activity.color === 'amber' ? '#f59e0b' : 
                                                     activity.color === 'indigo' ? '#6366f1' : '#000000'}`} />
                  </View>

                  {activity.streak > 0 && (
                    <View className={`absolute -bottom-1 -right-1 bg-${activity.color}-500
                      rounded-full p-1.5 flex items-center gap-0.5 shadow-lg`}>
                      <Star size={12} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">{activity.streak}</Text>
                    </View>
                  )}
                </View>

                <View className="text-center mt-2">
                  <Text className="text-sm text-gray-800 font-medium">{activity.name}</Text>
                  <Text className="text-xs text-gray-500">
                    {activity.timeSpent} / {activity.goal}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-8 space-y-6">
          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-medium mb-4">Activity Summary</Text>
            <View className="space-y-4">
              {activities.map((activity) => (
                <View key={activity.id} className="flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center gap-3">
                    <View className={`p-2 rounded-full bg-${activity.color}-50`}>
                      <activity.icon size={20} color={`${activity.color === 'rose' ? '#f43f5e' : 
                                                       activity.color === 'blue' ? '#3b82f6' : 
                                                       activity.color === 'amber' ? '#f59e0b' : 
                                                       activity.color === 'indigo' ? '#6366f1' : '#000000'}`} />
                    </View>
                    <View>
                      <Text className="font-medium text-gray-800">{activity.name}</Text>
                      <Text className="text-sm text-gray-500">{activity.timeSpent} of {activity.goal}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="font-medium text-gray-800">{activity.progress}%</Text>
                    {activity.streak > 0 && (
                      <View className="flex flex-row items-center gap-1">
                        <Star size={16} color="#f59e0b" />
                        <Text className="text-sm text-amber-500">{activity.streak}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-medium mb-4">Statistics</Text>
            <View className="flex flex-row gap-4">
              <View className="flex-1 bg-gray-50 rounded-lg p-3">
                <Text className="text-sm text-gray-600">Best Day</Text>
                <Text className="text-lg font-medium text-gray-800">Monday</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-lg p-3">
                <Text className="text-sm text-gray-600">Total Time</Text>
                <Text className="text-lg font-medium text-gray-800">2h 45m</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DailyProgressPage; 