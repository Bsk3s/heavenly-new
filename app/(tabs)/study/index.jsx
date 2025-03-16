import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import FolderList from '../../components/notes/FolderList';

export default function StudyScreen() {
  const [activeTab, setActiveTab] = useState('notes');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notes':
        return <FolderList />;
      case 'highlights':
        return (
          <View style={styles.comingSoonContainer}>
            <Feather name="bookmark" size={50} color="#8E8E93" />
            <Text style={styles.comingSoonText}>Highlights Coming Soon</Text>
            <Text style={styles.comingSoonSubtext}>
              Save and organize your favorite Bible verses
            </Text>
          </View>
        );
      case 'resources':
        return (
          <View style={styles.comingSoonContainer}>
            <Feather name="book-open" size={50} color="#8E8E93" />
            <Text style={styles.comingSoonText}>Resources Coming Soon</Text>
            <Text style={styles.comingSoonSubtext}>
              Access study materials and commentaries
            </Text>
          </View>
        );
      default:
        return <FolderList />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'notes' && styles.activeTab]} 
          onPress={() => setActiveTab('notes')}
        >
          <Feather 
            name="file-text" 
            size={18} 
            color={activeTab === 'notes' ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
            Notes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'highlights' && styles.activeTab]} 
          onPress={() => setActiveTab('highlights')}
        >
          <Feather 
            name="bookmark" 
            size={18} 
            color={activeTab === 'highlights' ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, activeTab === 'highlights' && styles.activeTabText]}>
            Highlights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'resources' && styles.activeTab]} 
          onPress={() => setActiveTab('resources')}
        >
          <Feather 
            name="book-open" 
            size={18} 
            color={activeTab === 'resources' ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
            Resources
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
}); 