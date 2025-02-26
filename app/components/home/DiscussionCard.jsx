import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MessagesSquare } from 'lucide-react-native';

const DiscussionCard = ({ topic, lastMessage, participants }) => (
  <View className="flex-shrink-0 w-72 bg-white rounded-xl p-4 shadow-sm">
    <View className="flex flex-row items-start justify-between">
      <View>
        <Text className="font-medium text-gray-800">{topic}</Text>
        <Text className="text-sm text-gray-500 mt-1">{lastMessage}</Text>
      </View>
      <MessagesSquare size={20} color="#3b82f6" />
    </View>
    <View className="mt-3 flex flex-row items-center justify-between">
      <Text className="text-xs text-gray-500">{participants} participants</Text>
      <TouchableOpacity>
        <Text className="text-sm font-medium text-blue-500">Join</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default DiscussionCard;
