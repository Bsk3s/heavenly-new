import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createNote, getNoteById, updateNote } from '../../services/notesService';

const NoteEditor = () => {
  const router = useRouter();
  const { noteId, folderId, isNew } = useLocalSearchParams();
  const [note, setNote] = useState({
    title: '',
    content: '',
    folderId: folderId || '',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const contentInputRef = useRef(null);

  useEffect(() => {
    if (isNew === 'true') {
      setIsLoading(false);
      if (contentInputRef.current) {
        setTimeout(() => contentInputRef.current.focus(), 100);
      }
    } else if (noteId) {
      loadNote();
    }
  }, [noteId, isNew]);

  const loadNote = async () => {
    try {
      setIsLoading(true);
      const noteData = await getNoteById(noteId);
      setNote(noteData);
    } catch (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Failed to load note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async () => {
    try {
      setIsSaving(true);
      
      // Extract title from first line or use "Untitled Note"
      const content = note.content || '';
      const lines = content.split('\n');
      const title = lines[0] ? lines[0].trim() : 'Untitled Note';
      
      const noteData = {
        ...note,
        title,
        updatedAt: new Date()
      };
      
      if (isNew === 'true') {
        await createNote(folderId, noteData);
      } else {
        await updateNote(noteId, noteData);
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
      setIsSaving(false);
    }
  };

  const handleContentChange = (text) => {
    setNote(prev => ({
      ...prev,
      content: text
    }));
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity 
          className="flex-row items-center" 
          onPress={() => {
            if (note.content && note.content.trim()) {
              saveNote();
            } else {
              router.back();
            }
          }}
          disabled={isSaving}
        >
          <Feather name="chevron-left" size={20} color="#007AFF" />
          <Text className="text-blue-500 text-base">Back</Text>
        </TouchableOpacity>
        
        <View className="flex-row">
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <TouchableOpacity 
                className="ml-4"
                onPress={saveNote}
              >
                <Feather name="save" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity className="ml-4">
                <Feather name="share" size={20} color="#007AFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <Text className="px-4 py-2 text-xs text-gray-500">
        {new Date(note.updatedAt).toLocaleString()}
      </Text>

      <ScrollView className="flex-1 px-4">
        <TextInput
          ref={contentInputRef}
          className="text-base text-black"
          placeholder="Start typing..."
          value={note.content}
          onChangeText={handleContentChange}
          multiline
          autoCapitalize="sentences"
          autoCorrect
        />
      </ScrollView>

      <View className="flex-row justify-between items-center p-4 border-t border-gray-200">
        <View className="flex-row">
          <TouchableOpacity className="mr-4">
            <Feather name="paperclip" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity className="mr-4">
            <Feather name="image" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-gray-500">
          {note.content ? note.content.length : 0} characters
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default NoteEditor; 