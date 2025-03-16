import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Component for selecting Bible versions with audio support
 * @param {Object} props - Component props
 * @param {Array} props.bibles - Array of available Bible versions
 * @param {Object} props.selectedBible - Currently selected Bible version
 * @param {Function} props.onSelectBible - Callback when Bible version is selected
 * @param {Object} props.style - Additional styles for the container
 */
const BibleVersionSelector = ({
  bibles = [],
  selectedBible,
  onSelectBible,
  style
}) => {
  // State for modal visibility
  const [modalVisible, setModalVisible] = useState(false);
  
  // Open modal
  const openModal = () => {
    setModalVisible(true);
  };
  
  // Close modal
  const closeModal = () => {
    setModalVisible(false);
  };
  
  // Handle Bible version selection
  const handleSelectBible = (bible) => {
    if (onSelectBible) {
      onSelectBible(bible);
    }
    closeModal();
  };
  
  // Render Bible version item
  const renderBibleItem = ({ item }) => {
    const isSelected = selectedBible && selectedBible.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.bibleItem,
          isSelected && styles.selectedBibleItem
        ]}
        onPress={() => handleSelectBible(item)}
      >
        <View style={styles.bibleItemContent}>
          <Text 
            style={[
              styles.bibleName,
              isSelected && styles.selectedBibleName
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text 
            style={styles.bibleDescription}
            numberOfLines={2}
          >
            {item.description || `${item.language.name} Bible`}
          </Text>
          
          {/* Audio indicator */}
          {item.audioBibles && item.audioBibles.length > 0 && (
            <View style={styles.audioIndicator}>
              <Ionicons name="volume-medium" size={14} color="#3478F6" />
              <Text style={styles.audioText}>Audio available</Text>
            </View>
          )}
        </View>
        
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#3478F6" />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Selected Bible button */}
      <TouchableOpacity
        style={styles.selectedBibleButton}
        onPress={openModal}
      >
        <Text style={styles.selectedBibleText}>
          {selectedBible ? selectedBible.abbreviation || selectedBible.name : 'Select Bible'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#3478F6" />
      </TouchableOpacity>
      
      {/* Bible selection modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Bible Version</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>
          
          {/* Filter info */}
          <View style={styles.filterInfo}>
            <Ionicons name="information-circle-outline" size={16} color="#666666" />
            <Text style={styles.filterInfoText}>
              Showing versions with audio support
            </Text>
          </View>
          
          {/* Bible list */}
          <FlatList
            data={bibles}
            renderItem={renderBibleItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.bibleList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No Bible versions available</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectedBibleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedBibleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3478F6',
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
  },
  filterInfoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  bibleList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bibleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedBibleItem: {
    backgroundColor: 'rgba(52, 120, 246, 0.1)',
  },
  bibleItemContent: {
    flex: 1,
    marginRight: 8,
  },
  bibleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  selectedBibleName: {
    color: '#3478F6',
  },
  bibleDescription: {
    fontSize: 14,
    color: '#666666',
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  audioText: {
    fontSize: 12,
    color: '#3478F6',
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default BibleVersionSelector; 