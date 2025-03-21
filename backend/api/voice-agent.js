/**
 * voice-agent.js
 * API endpoints for LiveKit voice agent interactions
 */

const { createVoiceAgent, startVoiceAgentSession } = require('../livekit/voice-agent');
const { AccessToken } = require('livekit-server-sdk');
const { v4: uuidv4 } = require('uuid');

// Store active agent sessions
const activeSessions = new Map();

/**
 * Start a new voice agent session
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function startSession(req, res) {
  try {
    const { persona = 'adina' } = req.body;
    
    // Generate a unique room name
    const roomName = `voice-${persona}-${uuidv4()}`;
    
    // Start the voice agent session
    const agent = await startVoiceAgentSession(roomName, persona);
    
    // Store the session
    activeSessions.set(roomName, {
      agent,
      persona,
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
    const { roomName } = req.body;
    
    if (!roomName || !activeSessions.has(roomName)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get the session
    const session = activeSessions.get(roomName);
    
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
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    
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
      url: process.env.LIVEKIT_WS_URL
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}

module.exports = {
  startSession,
  endSession,
  getToken,
}; 