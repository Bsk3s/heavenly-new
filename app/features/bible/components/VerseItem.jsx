import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bookmark, MessageSquare } from 'lucide-react-native';
import VerseNumber from './VerseNumber';

/**
 * Component to display a Bible verse with interaction options
 */
const VerseItem = ({ 
  verse, 
  isHighlighted, 
  isSelected, 
  onPress, 
  onHighlight, 
  onDiscuss,
  isFirstInParagraph = false
}) => {
  if (!verse || !verse.text) {
    console.warn('Invalid verse data:', verse);
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${isFirstInParagraph ? 'mt-6' : 'mt-1'} ${isHighlighted ? 'bg-amber-100' : ''}`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <VerseNumber number={verse.number} />
        <View className="flex-1">
          <Text 
            className="text-gray-900"
            style={{ 
              fontSize: 19,
              lineHeight: 28,
              fontWeight: '400',
              fontFamily: 'System',
              letterSpacing: 0.2
            }}
          >
            {verse.text}
          </Text>
        </View>
      </View>
      
      {isSelected && (
        <View className="flex-row mt-2 space-x-2">
          <TouchableOpacity 
            onPress={() => onHighlight(verse.id)}
            className={`p-2 rounded-full ${isHighlighted ? 'bg-amber-200' : 'bg-gray-200'}`}
          >
            <Bookmark 
              size={20} 
              color={isHighlighted ? "#D97706" : "#6B7280"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => onDiscuss(verse.id)}
            className="p-2 rounded-full bg-gray-200"
          >
            <MessageSquare 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default VerseItem; 