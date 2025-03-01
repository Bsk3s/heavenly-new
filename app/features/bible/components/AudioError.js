import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const AudioError = ({ error, onRetry, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <MaterialIcons name="error-outline" size={20} color="#DC2626" />
        <Text style={styles.errorText}>
          {error?.message || 'Error playing audio'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRetry}
        style={styles.retryButton}
      >
        <MaterialIcons name="refresh" size={18} color="#2563EB" />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#991B1B',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
});

export default AudioError; 