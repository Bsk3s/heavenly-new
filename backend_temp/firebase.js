/**
 * firebase.js
 * Firebase configuration and initialization for the backend
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try to load service account from environment variable first
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fall back to service account file
    const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../heavenlyhub-ab5ef-firebase-adminsdk-fbsvc-cb87fae26e.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else {
      console.error(`Firebase service account file not found at: ${serviceAccountPath}`);
      throw new Error('Firebase service account not available');
    }
  }
} catch (error) {
  console.error('Error loading Firebase service account:', error);
  throw error;
}

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://heavenlyhub-ab5ef.firebaseio.com"
  });
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  throw error;
}

// Export Firebase services
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage
}; 