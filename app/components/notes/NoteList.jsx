import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getNotes, deleteNote } from '../../services/notesService';

const NoteList = () => {
  const router = useRouter();
  const { folderId, folderName } = useLocalSearchParams();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (folderId) {
      loadNotes();
    }
  }, [folderId]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const noteData = await getNotes(folderId);
      setNotes(noteData);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = (noteId, noteTitle) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${noteTitle || 'Untitled Note'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteNote(noteId);
              await loadNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredNotes = notes.filter(note => {
    const title = note.title || 'Untitled Note';
    const content = note.content || '';
    const searchLower = searchQuery.toLowerCase();
    return title.toLowerCase().includes(searchLower) || 
           content.toLowerCase().includes(searchLower);
  });

  const renderEmptyNotes = () => (
    <View className="flex-1 items-center justify-center py-10">
      <Feather name="file-text" size={50} color="#8E8E93" />
      <Text className="text-gray-500 text-base mt-4">No notes yet</Text>
      <Text className="text-gray-500 text-sm">Tap + to create a new note</Text>
    </View>
  );

  const renderNoteItem = ({ item }) => {
    const title = item.title || 'Untitled Note';
    const date = new Date(item.updatedAt).toLocaleDateString();
    const preview = item.content ? 
      (item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content) 
      : '';

    return (
      <TouchableOpacity 
        className="py-3 border-b border-gray-200"
        onPress={() => router.push({
          pathname: '/(tabs)/study/editor',
          params: { noteId: item.id, folderId }
        })}
      >
        <View className="flex-row justify-between">
          <Text className="text-base font-medium text-black flex-1 mr-2">{title}</Text>
          <TouchableOpacity 
            className="p-1"
            onPress={() => handleDeleteNote(item.id, title)}
          >
            <Feather name="trash-2" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-gray-500 mb-1">{date}</Text>
        <Text className="text-sm text-gray-500" numberOfLines={2}>{preview}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1">
      <View className="px-4 py-2">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Feather name="search" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Search notes"
            className="flex-1 ml-2 text-black"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#8E8E93" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <View className="flex-1 px-4">
          {filteredNotes.length === 0 && !searchQuery ? (
            renderEmptyNotes()
          ) : (
            <FlatList
              data={filteredNotes}
              keyExtractor={item => item.id}
              renderItem={renderNoteItem}
              contentContainerStyle={{ flexGrow: 1 }}
              ListEmptyComponent={
                searchQuery ? (
                  <View className="flex-1 items-center justify-center py-10">
                    <Text className="text-gray-500">No notes match your search</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}

      <TouchableOpacity 
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-md"
        onPress={() => router.push({
          pathname: '/(tabs)/study/editor',
          params: { folderId, isNew: true }
        })}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default NoteList; 