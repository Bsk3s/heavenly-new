import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { X, Play, Clock, Star } from 'lucide-react-native';

const ActivityModal = memo(({ activity, visible, onClose }) => {
  if (!activity) return null;
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black bg-opacity-50" 
        onPress={onClose}
      >
        <View 
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl"
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3" />
          
          <View className="px-4 py-3 border-b border-gray-100">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-3">
                <View className={`p-2 rounded-full bg-${activity.color}-50`}>
                  <activity.icon size={20} color={`${activity.color === 'rose' ? '#f43f5e' : 
                                                   activity.color === 'blue' ? '#3b82f6' : 
                                                   activity.color === 'amber' ? '#f59e0b' : 
                                                   activity.color === 'indigo' ? '#6366f1' : '#000000'}`} />
                </View>
                <View>
                  <Text className="font-medium text-gray-800">{activity.name}</Text>
                  <Text className="text-xs text-gray-500">{activity.streak} day streak</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                className="p-2 rounded-full"
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="p-4 space-y-4">
            <View className="grid grid-cols-2 gap-3">
              <TouchableOpacity className="flex flex-col items-center justify-center p-4 bg-rose-50 rounded-xl">
                <Play size={24} color="#f43f5e" className="mb-2" />
                <Text className="text-sm font-medium text-gray-800">Start Timer</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl">
                <Clock size={24} color="#3b82f6" className="mb-2" />
                <Text className="text-sm font-medium text-gray-800">Log Time</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-600 mb-2">Quick Add</Text>
              <View className="flex flex-row flex-wrap gap-2">
                {['5 mins', '10 mins', '15 mins', '20 mins'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    className="py-2 px-4 bg-gray-50 rounded-lg"
                  >
                    <Text className="text-sm text-gray-800">{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-3">
              <View className="flex flex-row items-center gap-2 mb-2">
                <Star size={16} color="#f59e0b" />
                <Text className="text-sm font-medium text-gray-800">Progress</Text>
              </View>
              <View className="space-y-2 text-sm">
                <View className="flex flex-row justify-between items-center">
                  <Text className="text-gray-600">Current Streak</Text>
                  <Text className="font-medium text-gray-800">{activity.streak} days</Text>
                </View>
                <View className="flex flex-row justify-between items-center">
                  <Text className="text-gray-600">Best Streak</Text>
                  <Text className="font-medium text-gray-800">14 days</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
});

export default ActivityModal; 