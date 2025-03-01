import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

/**
 * Search bar component for the Bible reader
 */
const SearchBar = ({ value, onChangeText, onSubmit }) => {
  return (
    <View className="flex-row items-center bg-gray-100 mx-4 my-2 px-3 py-2 rounded-lg">
      <Search size={20} color="#6B7280" />
      <TextInput
        className="flex-1 ml-2 text-gray-800"
        placeholder="Search the Bible..."
        placeholderTextColor="#6B7280"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
    </View>
  );
};

export default SearchBar; 