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

const { createVoiceAgent, startVoiceAgentSession, endVoiceAgentSession } = require('../livekit/voice-agent');
const { AccessToken } = require('livekit-server-sdk');
const { v4: originalUuidv4 } = require('uuid');
const { injectPersonaPrompt } = require('../utils/injectPersonaPrompt');
const adinaConfig = require('../config/adina_agent.json');
const rafaConfig = require('../config/rafa_agent.json');
const express = require('express');
const router = express.Router();
const {
  generateToken,
  createSession,
  endSession,
  processTranscriptWithAI,
  textToSpeech
} = require('../livekit/voice-agent');
const BotParticipant = require('../livekit/bot-participant');
const axios = require('axios');
const { setTimeout } = require('timers');

// Store active agent sessions
const activeSessions = new Map();
// Store user session data for continuous conversations
const userSessions = new Map();

/**
 * Test LiveKit connection and configuration
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.get('/test-connection', (req, res) => {
  try {
    console.log('Testing LiveKit configuration...');
    
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_WS_URL;
    
    if (!apiKey || !apiSecret || !wsUrl) {
      console.error('Missing LiveKit configuration');
      return res.status(500).json({
        error: 'LiveKit configuration incomplete',
        missing: {
          apiKey: !apiKey,
          apiSecret: !apiSecret,
          wsUrl: !wsUrl
        }
      });
    }
    
    // Try to generate a test token to verify the configuration
    try {
      const testToken = generateToken('test-room', 'test-user');
      res.json({
        success: true,
        message: 'LiveKit configuration is valid',
        wsUrl,
        testToken
      });
    } catch (tokenError) {
      console.error('Error generating test token:', tokenError);
      res.status(500).json({
        error: 'LiveKit configuration is invalid',
        detail: tokenError.message
      });
    }
  } catch (error) {
    console.error('Error testing LiveKit:', error);
    res.status(500).json({
      error: 'Failed to test LiveKit connection',
      detail: error.message
    });
  }
});

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
router.post('/start', (req, res) => {
  try {
    const { roomName, persona = 'adina' } = req.body;
    
    if (!roomName) {
      return res.status(400).json({
        error: 'Missing required parameter: roomName'
      });
    }

    const session = createSession(persona, roomName);
    res.json(session);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * End an active voice agent session
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.post('/end', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required parameter: sessionId'
      });
    }

    const success = endSession(sessionId);
    if (success) {
      res.json({ message: 'Session ended successfully' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a token for a room
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.get('/token', (req, res) => {
  console.log('\n=== GET /api/voice/token HIT ==='); // Log route entry
  try {
    console.log('Request Query:', req.query); // Log incoming query parameters
    
    // Accept either participantName or participantIdentity
    const { roomName = 'heavenly-hub', participantName, participantIdentity } = req.query;
    const participantId = participantName || participantIdentity || 'guest';
    
    console.log(`Generating token for room: ${roomName}, participant: ${participantId}`);

    // Use the function from livekit/voice-agent.js for consistency
    const token = generateToken(roomName, participantId); 
    console.log('Token generated successfully:', token ? `${token.substring(0,10)}...` : '[No Token]'); // Log token generation success (masked)

    const responsePayload = { 
      token: token, 
      wsUrl: process.env.LIVEKIT_WS_URL 
    };
    console.log('Payload prepared:', JSON.stringify(responsePayload)); // Log the payload before sending

    // Return both token and wsUrl
    console.log('Sending JSON response...'); // Log before sending response
    res.json(responsePayload);
    console.log('JSON response sent.'); // Log after attempting to send

  } catch (error) {
    console.error('!!! ERROR in /api/voice/token handler:', error); // Log the caught error
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate token', 
      details: error.message 
    });
  }
  console.log('=== GET /api/voice/token END ===\n'); // Log route exit
});

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

// Process transcript
router.post('/process-transcript', async (req, res) => {
  try {
    const { transcript, persona = 'adina', sessionId } = req.body;
    
    if (!transcript) {
      return res.status(400).json({
        error: 'Missing required parameter: transcript'
      });
    }

    console.log('\n=== PROCESSING TRANSCRIPT ===');
    console.log('Time:', new Date().toISOString());
    console.log('Session ID:', sessionId || 'none');
    console.log('Persona:', persona);
    console.log('Transcript:', transcript);

    const config = persona.toLowerCase() === 'rafa' ? require('../config/rafa_agent.json') : require('../config/adina_agent.json');
    const response = await processTranscriptWithAI(transcript, config);

    // Log the AI response
    console.log('AI Response:', response);
    console.log('========================\n');

    // Store in session history if sessionId provided
    if (sessionId) {
      if (!userSessions.has(sessionId)) {
        userSessions.set(sessionId, {
          interactions: 0,
          history: [],
          lastInteraction: new Date()
        });
      }
      
      const session = userSessions.get(sessionId);
      session.interactions += 1;
      session.lastInteraction = new Date();
      session.history.push({
        timestamp: new Date(),
        transcript,
        response,
        persona
      });
    }

    res.json({ response });
  } catch (error) {
    console.error('Error processing transcript:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transcript history
router.get('/transcript-history', (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required parameter: sessionId'
      });
    }

    const session = userSessions.get(sessionId);
    if (!session) {
      return res.json({
        sessionId,
        history: []
      });
    }

    res.json({
      sessionId,
      interactions: session.interactions,
      lastInteraction: session.lastInteraction,
      history: session.history
    });
  } catch (error) {
    console.error('Error getting transcript history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log a raw transcript (for debugging)
router.post('/log-transcript', (req, res) => {
  try {
    const { transcript, source = 'deepgram', metadata = {} } = req.body;
    
    if (!transcript) {
      return res.status(400).json({
        error: 'Missing required parameter: transcript'
      });
    }

    console.log('\n=== RAW TRANSCRIPT LOG ===');
    console.log('Time:', new Date().toISOString());
    console.log('Source:', source);
    console.log('Transcript:', transcript);
    if (Object.keys(metadata).length > 0) {
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
    }
    console.log('========================\n');

    res.json({ 
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging transcript:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test TTS endpoint
router.post('/test-tts', async (req, res) => {
  try {
    const { text, persona = 'adina' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Missing required parameter: text'
      });
    }

    console.log('\n=== TESTING TTS ===');
    console.log('Time:', new Date().toISOString());
    console.log('Persona:', persona);
    console.log('Text:', text);

    const audioBuffer = await textToSpeech(text, persona);

    // Set appropriate headers for audio streaming
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('Error in TTS test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test bot audio injection
router.post('/test-bot', async (req, res) => {
  try {
    const { text, persona = 'adina', roomName } = req.body;
    
    if (!text || !roomName) {
      return res.status(400).json({
        error: 'Missing required parameters: text and roomName'
      });
    }

    console.log('\n=== TESTING BOT AUDIO INJECTION ===');
    console.log('Time:', new Date().toISOString());
    console.log('Persona:', persona);
    console.log('Room:', roomName);
    console.log('Text:', text);

    // Create bot participant
    const bot = new BotParticipant(roomName, persona);
    const token = await bot.connect();

    // Generate speech
    const audioBuffer = await textToSpeech(text, persona);

    // Inject audio
    await bot.injectAudio(audioBuffer);

    // Wait for audio to finish (approximate based on text length)
    const waitTime = Math.max(2000, text.length * 50); // Rough estimate
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Disconnect bot
    await bot.disconnect();

    res.json({ 
      success: true,
      message: 'Bot audio injection completed',
      token,
      duration: waitTime
    });
  } catch (error) {
    console.error('Error in bot audio test:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test room endpoint for voice agent
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.post('/test-room', async (req, res) => {
  try {
    console.log('=== Starting test-room endpoint ===');
    const { roomName } = req.body;
    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required' });
    }

    console.log('Creating bot participant...');
    const bot = new BotParticipant(roomName);
    
    console.log('Connecting to room...');
    const token = await bot.connect();
    console.log('Connected to room, token generated');

    console.log('Generating test audio...');
    const audioBuffer = await textToSpeech(
      'Hello! This is a test message from your voice agent.',
      'adina'
    );
    console.log('Test audio generated');

    console.log('Getting audio URL...');
    const audioUrl = await bot.getAudioUrl(audioBuffer);
    console.log('Audio URL generated');

    console.log('Notifying participants...');
    await bot.notifyParticipants(audioUrl);
    console.log('Participants notified');

    res.json({ 
      success: true, 
      message: 'Test audio sent to room',
      token,
      audioUrl 
    });
  } catch (error) {
    console.error('Error in test-room endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test LiveKit credentials
router.get('/test-credentials', (req, res) => {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_WS_URL;

    // Generate a test token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: 'test-user'
    });

    at.addGrant({
      roomJoin: true,
      room: 'test-room'
    });

    const token = at.toJwt();

    res.json({
      success: true,
      credentials: {
        apiKey: apiKey ? '***' + apiKey.slice(-4) : undefined,
        apiSecret: apiSecret ? '***' + apiSecret.slice(-4) : undefined,
        wsUrl
      },
      token
    });
  } catch (error) {
    console.error('Error testing LiveKit credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this at the end of the file
router.post('/direct-test/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    console.log('Received direct test request for room:', roomName);
    
    // Import the directTestAudio function from bot-participant
    const { directTestAudio } = require('../livekit/bot-participant');
    
    // Call the direct test function
    const result = await directTestAudio(roomName);
    
    // Return the result
    res.json(result);
  } catch (error) {
    console.error('Direct test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this at the end before module.exports = router;
router.get('/simple-test', (req, res) => {
  try {
    console.log('Simple test endpoint hit');
    res.json({
      success: true,
      message: 'Simple test endpoint working',
      time: new Date().toISOString(),
      livekit: {
        apiKey: process.env.LIVEKIT_API_KEY ? '***' + process.env.LIVEKIT_API_KEY.slice(-4) : undefined,
        apiSecret: process.env.LIVEKIT_API_SECRET ? '***' + process.env.LIVEKIT_API_SECRET.slice(-4) : undefined,
        wsUrl: process.env.LIVEKIT_WS_URL
      }
    });
  } catch (error) {
    console.error('Error in simple test endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this near the end before module.exports = router;
router.get('/ping', (req, res) => {
  console.log('Ping endpoint hit at', new Date().toISOString());
  res.json({
    success: true,
    message: 'Backend connection successful',
    time: new Date().toISOString()
  });
});

module.exports = router; 