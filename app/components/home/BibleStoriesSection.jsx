import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import BibleStoryCard from './BibleStoryCard';

const BibleStoriesSection = ({ stories }) => (
  <View>
    <View className="flex-row justify-between items-center mb-4">
      <Text className="text-xl font-semibold">Bible Stories</Text>
      <TouchableOpacity>
        <Text className="text-blue-500 text-sm font-medium">View All</Text>
      </TouchableOpacity>
    </View>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      className="-mx-4 px-4"
    >
      <View className="flex-row gap-4">
        {stories.map((story) => (
          <BibleStoryCard key={story.id} {...story} />
        ))}
      </View>
    </ScrollView>
  </View>
);

export default BibleStoriesSection; 