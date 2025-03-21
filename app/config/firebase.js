// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// Using environment variables for sensitive information
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey || "dummy-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.firebaseAuthDomain || "dummy-domain.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || Constants.expoConfig?.extra?.firebaseDatabaseURL,
  projectId: process.env.FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.firebaseProjectId || "dummy-project",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.firebaseStorageBucket || "dummy-storage.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.firebaseMessagingSenderId || "000000000000",
  appId: process.env.FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId || "1:000000000000:web:00000000000000",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || Constants.expoConfig?.extra?.firebaseMeasurementId
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let analytics = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication with AsyncStorage persistence for React Native
  if (Platform.OS !== 'web') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(app);
  }
  
  // Initialize Firebase services
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize Analytics if supported
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized successfully");
    }
  }).catch(error => {
    console.warn("Firebase Analytics not supported:", error);
  });
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  
  // Create mock implementations for development if Firebase fails to initialize
  if (!app) {
    console.warn("Using mock Firebase implementation");
    
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
  }
}

export { app, auth, db, storage, analytics };

// Default export
export default { app, auth, db, storage, analytics }; 