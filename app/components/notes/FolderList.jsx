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
import { useRouter } from 'expo-router';
import { getFolders, createFolder, deleteFolder } from '../../services/notesService';

const FolderList = () => {
  const router = useRouter();
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const folderData = await getFolders();
      setFolders(folderData);
    } catch (error) {
      console.error('Error loading folders:', error);
      Alert.alert('Error', 'Failed to load folders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      setIsLoading(true);
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
      await loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = (folderId, folderName) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${folderName}"? All notes in this folder will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteFolder(folderId);
              await loadFolders();
            } catch (error) {
              console.error('Error deleting folder:', error);
              Alert.alert('Error', 'Failed to delete folder. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEmptyFolders = () => (
    <View className="flex-1 items-center justify-center py-10">
      <Feather name="folder" size={50} color="#8E8E93" />
      <Text className="text-gray-500 text-base mt-4">No folders yet</Text>
      <Text className="text-gray-500 text-sm">Tap + to create a new folder</Text>
    </View>
  );

  const renderFolderItem = ({ item }) => (
    <TouchableOpacity 
      className="flex-row items-center justify-between py-3 border-b border-gray-200"
      onPress={() => router.push({
        pathname: '/(tabs)/study/notes',
        params: { folderId: item.id, folderName: item.name }
      })}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
          <Feather name="folder" size={20} color="#007AFF" />
        </View>
        <View>
          <Text className="text-base font-medium text-black">{item.name}</Text>
          <Text className="text-xs text-gray-500">
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity 
          className="p-2"
          onPress={() => handleDeleteFolder(item.id, item.name)}
        >
          <Feather name="trash-2" size={18} color="#FF3B30" />
        </TouchableOpacity>
        <Feather name="chevron-right" size={20} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      <View className="px-4 py-2">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Feather name="search" size={20} color="#8E8E93" />
          <TextInput
            placeholder="Search folders"
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
          {filteredFolders.length === 0 && !isCreatingFolder && !searchQuery ? (
            renderEmptyFolders()
          ) : (
            <FlatList
              data={filteredFolders}
              keyExtractor={item => item.id}
              renderItem={renderFolderItem}
              contentContainerStyle={{ flexGrow: 1 }}
              ListEmptyComponent={
                searchQuery ? (
                  <View className="flex-1 items-center justify-center py-10">
                    <Text className="text-gray-500">No folders match your search</Text>
                  </View>
                ) : null
              }
            />
          )}

          {isCreatingFolder && (
            <View className="mt-4 bg-gray-50 rounded-lg p-4">
              <TextInput
                className="bg-white rounded-lg p-3 text-base border border-gray-200"
                placeholder="Folder Name"
                value={newFolderName}
                onChangeText={setNewFolderName}
                autoFocus
              />
              <View className="flex-row justify-end mt-4">
                <TouchableOpacity 
                  className="px-4 py-2"
                  onPress={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                >
                  <Text className="text-gray-500 text-base">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="px-4 py-2 ml-2"
                  onPress={handleCreateFolder}
                >
                  <Text className="text-blue-500 text-base font-medium">Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {!isCreatingFolder && (
        <TouchableOpacity 
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-md"
          onPress={() => setIsCreatingFolder(true)}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default FolderList; 