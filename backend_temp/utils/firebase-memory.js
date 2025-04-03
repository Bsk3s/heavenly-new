/**
 * firebase-memory.js
 * Firebase integration for persisting conversation memory
 */

const admin = require('firebase-admin');
const { conversationMemory } = require('./injectPersonaPrompt');
let firebaseInitialized = false;

// Import polyfill for crypto.getRandomValues
try {
  require('get-random-values');
} catch (error) {
  console.warn('Failed to initialize UUID polyfill for Firebase memory:', error.message);
}

// Create a fallback UUID generator if needed
function generateFallbackID() {
  return 'fb-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
}

// Initialize Firebase if not already initialized
function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    // Check if app is already initialized to prevent duplicate initialization
    admin.app();
    firebaseInitialized = true;
  } catch (error) {
    try {
      // Initialize with service account if provided, otherwise use application default credentials
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      } else {
        // Use application default credentials
        admin.initializeApp({
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      }
      firebaseInitialized = true;
      console.log('Firebase initialized for memory persistence');
    } catch (initError) {
      console.error('Error initializing Firebase for memory persistence:', initError);
      // We'll continue with in-memory storage only
    }
  }
}

/**
 * Save conversation memory to Firebase
 * @param {string} sessionId - The user's session ID
 * @param {string} persona - The persona name
 */
async function saveMemoryToFirebase(sessionId, persona) {
  if (!sessionId || !persona) return;

  try {
    initializeFirebase();
    if (!firebaseInitialized) return;

    const key = `${sessionId}:${persona}`;
    const memories = conversationMemory.get(key) || [];

    if (memories.length === 0) return;

    const db = admin.firestore();
    const memoryRef = db.collection('userMemories').doc(sessionId);

    // Save the memories under the persona subcollection
    await memoryRef.set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      sessionId
    }, { merge: true });

    // Save each conversation entry
    const personaRef = memoryRef.collection('personas').doc(persona);
    await personaRef.set({
      conversations: memories,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Saved ${memories.length} memories to Firebase for ${key}`);
  } catch (error) {
    console.error('Error saving memory to Firebase:', error);
    // Continue with in-memory storage only
  }
}

/**
 * Load conversation memory from Firebase
 * @param {string} sessionId - The user's session ID
 * @param {string} persona - The persona name
 */
async function loadMemoryFromFirebase(sessionId, persona) {
  if (!sessionId || !persona) return;

  try {
    initializeFirebase();
    if (!firebaseInitialized) return;

    const key = `${sessionId}:${persona}`;
    const db = admin.firestore();

    const personaRef = db.collection('userMemories')
      .doc(sessionId)
      .collection('personas')
      .doc(persona);

    const doc = await personaRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data && data.conversations && Array.isArray(data.conversations)) {
        // Update the in-memory storage
        conversationMemory.set(key, data.conversations);
        console.log(`Loaded ${data.conversations.length} memories from Firebase for ${key}`);
      }
    }
  } catch (error) {
    console.error('Error loading memory from Firebase:', error);
    // We'll continue with what's in memory already
  }
}

/**
 * Clear a user's memories from Firebase
 * @param {string} sessionId - The user's session ID
 */
async function clearFirebaseMemory(sessionId) {
  if (!sessionId) return;

  try {
    initializeFirebase();
    if (!firebaseInitialized) return;

    const db = admin.firestore();
    const memoryRef = db.collection('userMemories').doc(sessionId);

    // Get all persona subcollections
    const personasRef = await memoryRef.collection('personas').listDocuments();

    // Delete each persona document
    const batch = db.batch();
    for (const personaDoc of personasRef) {
      batch.delete(personaDoc);
    }

    // Delete the main document
    batch.delete(memoryRef);

    // Commit the batch delete
    await batch.commit();

    console.log(`Cleared Firebase memories for session ${sessionId}`);
    return true;
  } catch (error) {
    console.error('Error clearing Firebase memory:', error);
    return false;
  }
}

module.exports = {
  saveMemoryToFirebase,
  loadMemoryFromFirebase,
  clearFirebaseMemory
}; 