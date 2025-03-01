import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useVerses } from '../contexts/VersesContext';

const VerseItem = ({ verse, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(verse.id)}
      className={`py-2 ${isSelected ? 'bg-blue-50' : ''}`}
    >
      <View className="flex-row">
        <Text className="text-gray-500 mr-2">{verse.number}</Text>
        <Text className="flex-1 text-gray-900">{verse.text}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function VerseList({ verses }) {
  const { currentVerse, selectVerse } = useVerses();

  if (!verses || verses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-gray-500">No verses available</Text>
      </View>
    );
  }

  return (
    <View className="py-4">
      {verses.map((verse) => (
        <VerseItem
          key={verse.id}
          verse={verse}
          isSelected={currentVerse?.id === verse.id}
          onPress={selectVerse}
        />
      ))}
    </View>
  );
} 