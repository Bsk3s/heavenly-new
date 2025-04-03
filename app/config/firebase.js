// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// We're using a placeholder config for development
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey || "AIzaSyDev-placeholder-key-for-development",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.firebaseAuthDomain || "heavenlyhub-dev.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.firebaseProjectId || "heavenlyhub-dev",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.firebaseStorageBucket || "heavenlyhub-dev.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.firebaseMessagingSenderId || "000000000000",
  appId: process.env.FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId || "1:000000000000:web:0000000000000000000000",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || Constants.expoConfig?.extra?.firebaseMeasurementId || "G-PLACEHOLDER"
};

// Log config details for debugging
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? `✓ Set (${firebaseConfig.apiKey.substring(0, 5)}...)` : '✗ Missing',
  projectId: firebaseConfig.projectId ? '✓ Set' : '✗ Missing',
  appId: firebaseConfig.appId ? '✓ Set' : '✗ Missing'
});

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let analytics = null;

// Initialize with mock implementation for development
console.log("Using mock Firebase implementation for development");

// Mock auth
auth = {
  currentUser: { uid: 'mock-user-id' },
  onAuthStateChanged: (callback) => {
    callback({ uid: 'mock-user-id' });
    return () => {};
  },
  signInWithEmailAndPassword: async () => ({ user: { uid: 'mock-user-id' } }),
  createUserWithEmailAndPassword: async () => ({ user: { uid: 'mock-user-id' } }),
  signOut: async () => {}
};

// Mock db with in-memory storage
const mockCollections = {
  'users/mock-user-id/folders': [],
  'users/mock-user-id/notes': []
};

db = {
  collection: (path) => ({
    doc: (id) => ({
      id,
      get: async () => ({
        exists: () => mockCollections[path]?.some(item => item.id === id) || false,
        data: () => mockCollections[path]?.find(item => item.id === id) || null,
        id
      }),
      set: async (data) => {
        const index = mockCollections[path]?.findIndex(item => item.id === id) || -1;
        if (index >= 0) {
          mockCollections[path][index] = { id, ...data };
        } else {
          mockCollections[path].push({ id, ...data });
        }
      },
      update: async (data) => {
        const index = mockCollections[path]?.findIndex(item => item.id === id) || -1;
        if (index >= 0) {
          mockCollections[path][index] = { ...mockCollections[path][index], ...data };
        }
      },
      delete: async () => {
        const index = mockCollections[path]?.findIndex(item => item.id === id) || -1;
        if (index >= 0) {
          mockCollections[path].splice(index, 1);
        }
      }
    }),
    add: async (data) => {
      const id = `mock-${Date.now()}`;
      mockCollections[path].push({ id, ...data });
      return { id };
    },
    where: () => ({
      get: async () => ({
        docs: mockCollections[path].map(item => ({
          id: item.id,
          data: () => item
        }))
      })
    }),
    orderBy: () => ({
      get: async () => ({
        docs: mockCollections[path].map(item => ({
          id: item.id,
          data: () => item
        }))
      })
    })
  })
};

// Mock app and storage
app = { name: 'mock-app' };
storage = {
  ref: () => ({
    child: () => ({
      put: async () => ({
        ref: {
          getDownloadURL: async () => 'https://example.com/mock-image.jpg'
        }
      })
    })
  })
};

// Named exports
export { app, auth, db, storage, analytics };

// Default export
export default { app, auth, db, storage, analytics }; 