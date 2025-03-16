import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  SectionList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.8; // 80% of screen height

const BottomSheetModal = ({
  visible,
  title,
  data,
  sections,
  renderItem,
  renderSectionHeader,
  onClose,
  keyExtractor,
  numColumns = 1,
  isBookSelection = false
}) => {
  // Use a placeholder for empty data to prevent errors
  const safeData = data || [];
  const safeSections = sections || [];
  
  // Ensure keyExtractor is defined
  const safeKeyExtractor = keyExtractor || ((item) => item.id || String(item));

  // Animation values
  const translateY = new Animated.Value(DRAWER_HEIGHT);
  const backdropOpacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Slide up the drawer
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Fade in backdrop
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset position when modal is hidden
      translateY.setValue(DRAWER_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  // Create pan responder for swipe down gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      // Only allow downward movement
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      // If dragged down far enough, close the drawer
      if (gestureState.dy > DRAWER_HEIGHT / 4) {
        onClose();
      } else {
        // Otherwise snap back to open position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* Semi-transparent backdrop */}
      <Animated.View 
        style={[
          styles.backdrop, 
          { opacity: backdropOpacity, backgroundColor: 'rgba(0, 0, 0, 0.5)' }
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      
      {/* Bottom sheet */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateY }] }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Pill handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.contentContainer}>
          {sections && sections.length > 0 ? (
            <SectionList
              sections={safeSections}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={safeKeyExtractor}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled={true}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          ) : (
            <FlatList
              data={safeData}
              renderItem={renderItem}
              keyExtractor={safeKeyExtractor}
              numColumns={numColumns}
              contentContainerStyle={styles.listContent}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              key={numColumns > 1 ? 'grid' : 'list'}
              columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
            />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
});

export default BottomSheetModal; 