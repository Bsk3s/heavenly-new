import AsyncStorage from '@react-native-async-storage/async-storage';

// Prefix for note keys
const NOTE_KEY_PREFIX = 'note_';
const FOLDER_KEY_PREFIX = 'folder_';

// Helper function to generate unique IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Create a new note
export const createNote = async (folderId, noteData) => {
  try {
    const noteId = generateId();
    const note = {
      id: noteId,
      ...noteData,
      folderId: folderId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(`${NOTE_KEY_PREFIX}${noteId}`, JSON.stringify(note));
    
    // If this note belongs to a folder, update the folder's notes list
    if (folderId) {
      const folderKey = `${FOLDER_KEY_PREFIX}${folderId}`;
      const folderData = await AsyncStorage.getItem(folderKey);
      
      if (folderData) {
        const folder = JSON.parse(folderData);
        const noteIds = folder.noteIds || [];
        
        folder.noteIds = [...noteIds, noteId];
        await AsyncStorage.setItem(folderKey, JSON.stringify(folder));
      }
    }
    
    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Get a note by ID
export const getNoteById = async (noteId) => {
  try {
    const noteData = await AsyncStorage.getItem(`${NOTE_KEY_PREFIX}${noteId}`);
    
    if (!noteData) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    return JSON.parse(noteData);
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

// Update a note
export const updateNote = async (noteId, updatedData) => {
  try {
    const noteData = await AsyncStorage.getItem(`${NOTE_KEY_PREFIX}${noteId}`);
    
    if (!noteData) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const note = JSON.parse(noteData);
    const updatedNote = {
      ...note,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(`${NOTE_KEY_PREFIX}${noteId}`, JSON.stringify(updatedNote));
    
    return updatedNote;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId) => {
  try {
    const noteData = await AsyncStorage.getItem(`${NOTE_KEY_PREFIX}${noteId}`);
    
    if (!noteData) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const note = JSON.parse(noteData);
    
    // If this note belongs to a folder, update the folder's notes list
    if (note.folderId) {
      const folderKey = `${FOLDER_KEY_PREFIX}${note.folderId}`;
      const folderData = await AsyncStorage.getItem(folderKey);
      
      if (folderData) {
        const folder = JSON.parse(folderData);
        const noteIds = folder.noteIds || [];
        
        folder.noteIds = noteIds.filter(id => id !== noteId);
        await AsyncStorage.setItem(folderKey, JSON.stringify(folder));
      }
    }
    
    await AsyncStorage.removeItem(`${NOTE_KEY_PREFIX}${noteId}`);
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Get all notes
export const getAllNotes = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const noteKeys = keys.filter(key => key.startsWith(NOTE_KEY_PREFIX));
    
    if (noteKeys.length === 0) {
      return [];
    }
    
    const notesData = await AsyncStorage.multiGet(noteKeys);
    return notesData.map(([key, value]) => JSON.parse(value))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('Error getting all notes:', error);
    throw error;
  }
};

// Get notes by folder ID
export const getNotesByFolderId = async (folderId) => {
  try {
    const allNotes = await getAllNotes();
    return allNotes.filter(note => note.folderId === folderId);
  } catch (error) {
    console.error('Error getting notes by folder:', error);
    throw error;
  }
};

// For backward compatibility
export const getNotes = getNotesByFolderId;

// Default export for all functions
export default {
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  getAllNotes,
  getNotesByFolderId,
  getNotes
}; 