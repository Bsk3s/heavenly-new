/**
 * voice-agent.js
 * API endpoints for LiveKit voice agent interactions
 */

// Import polyfill for crypto.getRandomValues
try {
  require('get-random-values');
  console.log('UUID polyfill initialized');
} catch (error) {
  console.warn('Failed to initialize UUID polyfill:', error.message);
}

const { createVoiceAgent, startVoiceAgentSession } = require('../livekit/voice-agent');
const { AccessToken } = require('livekit-server-sdk');
const { v4: originalUuidv4 } = require('uuid');
const { injectPersonaPrompt } = require('../utils/injectPersonaPrompt');
const adinaConfig = require('../config/adina_agent.json');
const rafaConfig = require('../config/rafa_agent.json');

// Store active agent sessions
const activeSessions = new Map();
// Store user session data for continuous conversations
const userSessions = new Map();

/**
 * Test LiveKit connection and configuration
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function testConnection(req, res) {
  try {
    console.log('Testing LiveKit configuration...');
    // Check environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_WS_URL;

    console.log('Checking LiveKit configuration:', {
      apiKey: apiKey,  // Log the actual key for debugging
      apiKeyLength: apiKey ? apiKey.length : 0,
      hasApiSecret: !!apiSecret,
      apiSecretLength: apiSecret ? apiSecret.length : 0,
      wsUrl,
      wsUrlTrimmed: wsUrl ? wsUrl.trim() : null
    });

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error('Missing LiveKit configuration');
      return res.status(500).json({ 
        success: false, 
        error: 'LiveKit configuration incomplete',
        detail: 'Missing required environment variables',
        check: {
          apiKey: !!apiKey,
          apiSecret: !!apiSecret,
          wsUrl: !!wsUrl
        }
      });
    }

    // Try to create an access token as a basic test
    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: 'test-user',
        name: 'Test User',  // Add a name
        ttl: 60 * 60 // 1 hour in seconds
      });

      // Add all necessary permissions
      at.addGrant({
        room: 'test-room',
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      });

      const token = at.toJwt();
      
      console.log('Successfully created test token with permissions');
      
      // Return both success status and the test token
      return res.status(200).json({
        success: true,
        message: 'LiveKit configuration is valid',
        config: {
          apiKey: apiKey,  // Include actual key in response
          apiKeyLength: apiKey.length,
          hasApiSecret: !!apiSecret,
          apiSecretLength: apiSecret.length,
          wsUrl: wsUrl.trim(), // Ensure no trailing spaces
          wsUrlFormat: wsUrl.trim().startsWith('wss://') ? 'valid' : 'invalid'
        },
        testToken: token
      });
    } catch (tokenError) {
      console.error('Error creating test token:', tokenError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create test token',
        detail: tokenError.message,
        apiKeyFirstChar: apiKey ? apiKey.charAt(0) : null,
        apiKeyLastChar: apiKey ? apiKey.charAt(apiKey.length - 1) : null,
        apiSecretFirstChar: apiSecret ? apiSecret.charAt(0) : null,
        apiSecretLastChar: apiSecret ? apiSecret.charAt(apiSecret.length - 1) : null
      });
    }
  } catch (error) {
    console.error('Error testing LiveKit connection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test LiveKit connection',
      detail: error.message
    });
  }
}

// Create a fallback UUID generator
function generateFallbackUUID() {
  // Simple UUID generator that doesn't rely on crypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Safely generate a UUID with fallback
function uuidv4() {
  try {
    return originalUuidv4();
  } catch (error) {
    console.warn('UUID generation failed, using fallback method:', error.message);
    return generateFallbackUUID();
  }
}

/**
 * Start a new voice agent session
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function startSession(req, res) {
  try {
    const { persona = 'adina', sessionId } = req.body;

    // Generate a unique room name
    const roomName = `voice-${persona}-${uuidv4()}`;

    // Get the appropriate config for this persona
    const personaConfig = persona === 'adina' ? adinaConfig : rafaConfig;

    // Set context for the agent if we have previous session data
    let agentContext = '';
    if (sessionId) {
      // Store or update user session info
      if (!userSessions.has(sessionId)) {
        userSessions.set(sessionId, {
          firstInteraction: new Date(),
          interactions: 0,
          personaHistory: new Set()
        });
      }

      // Update session data
      const userSession = userSessions.get(sessionId);
      userSession.lastInteraction = new Date();
      userSession.interactions += 1;
      userSession.personaHistory.add(persona);
      userSession.currentPersona = persona;

      // Log session activity
      console.log(`User session ${sessionId} activity: Interaction #${userSession.interactions} with ${persona}`);
    }

    // Start the voice agent session
    const agent = await startVoiceAgentSession(roomName, persona, sessionId);

    // Store the session
    activeSessions.set(roomName, {
      agent,
      persona,
      sessionId,
      startTime: new Date(),
    });

    // Return the room details to the client
    return res.status(200).json({
      roomName,
      persona,
      success: true,
    });
  } catch (error) {
    console.error('Error starting voice agent session:', error);
    return res.status(500).json({ error: 'Failed to start voice agent session' });
  }
}

/**
 * End an active voice agent session
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function endSession(req, res) {
  try {
    const { roomName, sessionId } = req.body;

    if (!roomName || !activeSessions.has(roomName)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get the session
    const session = activeSessions.get(roomName);

    // Update user session data if sessionId is provided
    if (sessionId && userSessions.has(sessionId)) {
      const userSession = userSessions.get(sessionId);
      userSession.lastInteraction = new Date();
      console.log(`User session ${sessionId} ended voice chat with ${session.persona}`);
    }

    // Disconnect the agent
    await session.agent.disconnect();

    // Remove the session
    activeSessions.delete(roomName);

    return res.status(200).json({
      success: true,
      message: `Voice agent session ended for room: ${roomName}`,
    });
  } catch (error) {
    console.error('Error ending voice agent session:', error);
    return res.status(500).json({ error: 'Failed to end voice agent session' });
  }
}

/**
 * Get LiveKit token for client connection
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function getToken(req, res) {
  try {
    const { roomName, participantName } = req.query;

    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'Room name and participant name are required' });
    }

    // Create a new token
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const wsUrl = process.env.LIVEKIT_WS_URL || 'wss://heavenlyhub-6gfqnj0d.livekit.cloud';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LiveKit API key or secret not configured' });
    }

    // Create access token with identity
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });

    // Grant permissions to join room
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    // Generate token
    const token = at.toJwt();

    return res.status(200).json({
      token,
      roomName,
      participantName,
      url: wsUrl
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}

/**
 * Clean up old user sessions (can be called periodically)
 * Sessions older than 30 days will be removed
 */
function cleanupOldSessions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const [sessionId, sessionData] of userSessions.entries()) {
    if (sessionData.lastInteraction && sessionData.lastInteraction < thirtyDaysAgo) {
      console.log(`Cleaning up old user session: ${sessionId}`);
      userSessions.delete(sessionId);
    }
  }
}

/**
 * Clear user session memory
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function clearUserMemory(req, res) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Find all session keys for this user (both personas)
    const personaKeys = ['adina', 'rafa'];
    let memoriesCleared = 0;

    for (const persona of personaKeys) {
      const key = `${sessionId}:${persona}`;

      // Check if memory exists for this session+persona combo
      if (userSessions.has(sessionId)) {
        const userSession = userSessions.get(sessionId);
        userSession.interactions = 0;
        userSession.lastInteraction = new Date();
        userSession.currentPersona = null;
        console.log(`Reset user session data for ${sessionId}`);
        memoriesCleared++;
      }

      // Clear from conversation memory
      const { injectPersonaPrompt } = require('../utils/injectPersonaPrompt');
      const conversationMemory = require('../utils/injectPersonaPrompt').conversationMemory;

      if (conversationMemory && conversationMemory.has(key)) {
        conversationMemory.delete(key);
        console.log(`Cleared conversation memory for ${key}`);
        memoriesCleared++;
      }
    }

    // Clear memory from Firebase if available
    try {
      const { clearFirebaseMemory } = require('../utils/firebase-memory');
      await clearFirebaseMemory(sessionId);
      console.log(`Cleared Firebase memory for ${sessionId}`);
    } catch (error) {
      console.warn('Error clearing Firebase memory:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: `Memory cleared for session: ${sessionId}`,
      memoriesCleared
    });
  } catch (error) {
    console.error('Error clearing user memory:', error);
    return res.status(500).json({ error: 'Failed to clear memory' });
  }
}

// Export the handlers
module.exports = {
  startSession,
  endSession,
  getToken,
  testConnection,
  clearUserMemory,
  cleanupOldSessions
}; 