require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Test LiveKit connection
app.get('/api/voice/test-connection', (req, res) => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  // Check if we have all required config
  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({
      success: false,
      error: 'Missing LiveKit configuration',
      details: {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasWsUrl: !!wsUrl
      }
    });
  }

  try {
    // Try to create a test token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: 'test-user'
    });
    token.addGrant({ roomJoin: true, room: 'test-room' });
    token.toJwt(); // Verify we can create a token

    res.json({
      success: true,
      message: 'LiveKit configuration is valid',
      config: {
        wsUrl,
        hasApiKey: true,
        hasApiSecret: true
      }
    });
  } catch (error) {
    console.error('Failed to create test token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test token',
      message: error.message
    });
  }
});

// Get token for room
app.get('/api/voice/token', (req, res) => {
  try {
    console.log('Token request:', req.query);
    const { roomName, participantId, persona } = req.query;

    if (!roomName || !participantId) {
      return res.status(400).json({ 
        success: false,
        error: 'Room name and participant ID are required',
        received: { roomName, participantId, persona }
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_WS_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return res.status(500).json({ 
        success: false,
        error: 'LiveKit configuration not available' 
      });
    }

    console.log('Creating token with:', { apiKey, wsUrl, roomName, participantId });

    // Create access token with metadata
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId,
      name: participantId,
      metadata: JSON.stringify({
        persona,
        type: 'voice'
      })
    });

    // Add permissions with specific grants
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomCreate: false,
      roomAdmin: false,
      roomList: false
    });

    // Generate token
    const token = at.toJwt();
    console.log('Token generated successfully');

    return res.json({
      success: true,
      token,
      url: wsUrl,
      roomName,
      participantId
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to generate token',
      detail: error.message
    });
  }
});

// Start voice session endpoint
app.post('/api/voice/start', (req, res) => {
  try {
    console.log('Start session request:', req.body);
    const { persona, participantId, sessionId } = req.body;

    if (!persona || !sessionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Persona and session ID are required' 
      });
    }

    const roomName = `voice-${persona}-${sessionId}`;
    console.log('Created room:', roomName);

    res.json({
      success: true,
      roomName,
      message: 'Voice session started'
    });
  } catch (error) {
    console.error('Error starting voice session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start voice session',
      detail: error.message
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  GET /');
  console.log('  GET /api/voice/test-connection');
  console.log('  GET /api/voice/token');
  console.log('  POST /api/voice/start');
}); 