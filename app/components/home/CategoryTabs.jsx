import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { BookOpen, Heart, Sun, Moon, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const CategoryTabs = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', icon: BookOpen, label: 'All' },
    { id: 'devotional', icon: Heart, label: 'Devotional' },
    { id: 'morning', icon: Sun, label: 'Morning' },
    { id: 'evening', icon: Moon, label: 'Evening' },
    { id: 'favorites', icon: Star, label: 'Favorites' },
  ];

  const handlePress = async (categoryId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategoryChange(categoryId);
  };

  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-b border-gray-200"
    >
      <View className="flex-row px-4 space-x-3 py-3">
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => handlePress(category.id)}
            className={`
              flex-row items-center px-4 py-2 rounded-full space-x-2
              ${activeCategory === category.id ? 'bg-gray-900' : 'bg-gray-100'}
            `}
          >
            <category.icon 
              size={18}
              color={activeCategory === category.id ? '#FFFFFF' : '#6B7280'}
            />
            <Text className={`
              text-sm font-medium
              ${activeCategory === category.id ? 'text-white' : 'text-gray-600'}
            `}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default React.memo(CategoryTabs);
