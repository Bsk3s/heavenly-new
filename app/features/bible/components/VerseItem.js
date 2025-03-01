import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const VerseItem = ({
  verse,
  isHighlighted,
  isSelected,
  onPress,
  onHighlight,
  onDiscuss,
  isFirstInParagraph = false,
}) => {
  return (
    <Pressable
      onPress={() => onPress(verse.id)}
      style={({ pressed }) => [
        styles.container,
        isFirstInParagraph && styles.firstInParagraph,
        isHighlighted && styles.highlighted,
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.verseContent}>
        <Text style={styles.verseNumber}>{verse.number}</Text>
        <Text style={[
          styles.verseText,
          isHighlighted && styles.highlightedText,
          isSelected && styles.selectedText,
        ]}>
          {verse.text}
        </Text>
      </View>

      {isSelected && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onHighlight(verse.id)}
            style={[styles.actionButton, isHighlighted && styles.activeAction]}
          >
            <MaterialIcons
              name="brush"
              size={20}
              color={isHighlighted ? "#2563EB" : "#6B7280"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDiscuss(verse.id)}
            style={styles.actionButton}
          >
            <MaterialIcons name="chat" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderRadius: 12,
  },
  firstInParagraph: {
    marginTop: 16,
  },
  highlighted: {
    backgroundColor: '#EFF6FF',
  },
  selected: {
    backgroundColor: '#F3F4F6',
  },
  pressed: {
    opacity: 0.7,
  },
  verseContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
    marginTop: 2,
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  highlightedText: {
    color: '#2563EB',
  },
  selectedText: {
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
  },
  activeAction: {
    backgroundColor: '#EFF6FF',
  },
});

export default VerseItem; 