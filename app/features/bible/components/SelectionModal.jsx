import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable, SectionList } from 'react-native';
import { X } from 'lucide-react-native';

/**
 * Reusable selection modal component
 */
const SelectionModal = ({ 
  visible, 
  title, 
  data, 
  renderItem, 
  onClose,
  keyExtractor = (item) => item.id,
  numColumns = 1,
  sections = null,
  renderSectionHeader = null,
  isBookSelection = false
}) => {
  const [sortAlphabetically, setSortAlphabetically] = useState(false);

  // Sort data alphabetically if needed
  const sortedData = isBookSelection && sortAlphabetically && data 
    ? [...data].sort((a, b) => a.name.localeCompare(b.name))
    : data;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable 
        className="flex-1 bg-black/30" 
        onPress={onClose}
      >
        <View 
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80%] flex"
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Handle and Header */}
          <View>
            <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3" />
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-800">{title}</Text>
              <TouchableOpacity 
                onPress={onClose}
                className="p-2 rounded-full"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1">
            {sections ? (
              <SectionList
                sections={sections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                className="px-4"
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={true}
                bounces={false}
              />
            ) : (
              <FlatList
                data={sortedData}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                numColumns={numColumns}
                className="px-4"
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={true}
                bounces={false}
              />
            )}
          </View>

          {/* Bottom Toggle */}
          {isBookSelection && (
            <View className="px-4 pb-8 pt-3 border-t border-gray-100">
              <View className="flex-row bg-gray-100 rounded-lg p-1.5">
                <TouchableOpacity 
                  className={`flex-1 py-3 rounded-md ${!sortAlphabetically ? 'bg-white shadow' : ''}`}
                  onPress={() => setSortAlphabetically(false)}
                >
                  <Text 
                    className={`text-center text-base font-medium ${!sortAlphabetically ? 'text-gray-900' : 'text-gray-600'}`}
                  >
                    Traditional
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 py-3 rounded-md ${sortAlphabetically ? 'bg-white shadow' : ''}`}
                  onPress={() => setSortAlphabetically(true)}
                >
                  <Text 
                    className={`text-center text-base font-medium ${sortAlphabetically ? 'text-gray-900' : 'text-gray-600'}`}
                  >
                    Alphabetical
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
};

export default SelectionModal; 