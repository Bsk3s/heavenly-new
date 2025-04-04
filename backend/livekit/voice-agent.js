/**
 * voice-agent.js
 * Handles voice agent session management and token generation
 */

const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const { Deepgram } = require('@deepgram/sdk');
const axios = require('axios');
const { injectPersonaPrompt, extractPersonaResponse } = require('../utils/injectPersonaPrompt');
const adinaConfig = require('../config/adina_agent.json');
const rafaConfig = require('../config/rafa_agent.json');
const { v4: uuidv4 } = require('uuid');
const { Buffer } = require('buffer');

// Initialize Deepgram
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = new Deepgram(deepgramApiKey);

// Initialize OpenAI
let openai;
try {
  // Initialize OpenAI with the new SDK format
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('Voice agent: OpenAI initialized with new SDK format');
} catch (error) {
  console.error('Error initializing OpenAI:', error);
  // Fallback to a mock implementation for testing
  openai = {
    completions: {
      create: async () => ({
        choices: [{ text: 'Test response from mock OpenAI (API initialization failed)' }]
      })
    }
  };
  console.warn('Using mock OpenAI implementation in voice agent');
}

// Active sessions store
const activeSessions = new Map();

/**
 * Generate a LiveKit token for a participant
 */
function generateToken(roomName, participantName) {
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }

  const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
    { identity: participantName }
    );
    
  at.addGrant({
    roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });
    
  return at.toJwt();
}

/**
 * Create a new voice agent session
 */
function createSession(persona = 'adina', roomName) {
  const sessionId = uuidv4();
  const config = persona.toLowerCase() === 'rafa' ? rafaConfig : adinaConfig;
  
  const session = {
    id: sessionId,
    persona,
    config,
    roomName,
    startTime: Date.now(),
    active: true
  };

  activeSessions.set(sessionId, session);
  return session;
}

/**
 * End a voice agent session
 */
function endSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.active = false;
    session.endTime = Date.now();
    activeSessions.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * Process transcript with AI
 */
async function processTranscriptWithAI(transcript, config) {
  try {
    console.log('Processing transcript with config:', config.name);

    // Skip OpenAI if API key not configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      console.warn('OpenAI API key not configured, using test response.');
      return `[TEST RESPONSE] ${config.name} says: I received your message: "${transcript}"`;
    }

    // Prepare messages for the Chat Completions API
    const messages = [
      { role: 'system', content: config.systemPrompt },
      // TODO: Add conversation history here if needed
      { role: 'user', content: transcript }
    ];

    console.log('Sending request to OpenAI Chat API with messages:', JSON.stringify(messages, null, 2));

    // Use the Chat Completions API
    const completion = await openai.chat.completions.create({
      // Use the model specified in config, or default to gpt-3.5-turbo
      model: config.model || 'gpt-3.5-turbo', 
      messages: messages,
      // Use temperature from config or default
      temperature: config.temperature || 0.7, 
      // Use max_tokens from config or default, ensure it's reasonable
      max_tokens: config.maxResponseLength || 150, 
      // Use other parameters from config if available
      presence_penalty: config.presence_penalty || 0,
      frequency_penalty: config.frequency_penalty || 0,
      // stop sequences can be useful for chat models too
      stop: config.stopSequences || ["\\n", "User:", `${config.name}:`] 
    });

    // Extract the response content
    const response = completion.choices[0].message?.content?.trim() || '';

    console.log('Raw AI Response:', response);
    
    // Optional: Add back prefix removal if needed for chat models
    // if (config.responsePrefixes) { ... }

    return response;

  } catch (error) {
    console.error('Error processing transcript with AI:', error);
    if (error.response) {
      // Log detailed error data if available (common with HTTP errors)
      console.error('OpenAI API Error Details:', error.response.data || error.response.statusText);
    } else if (error.code) {
      // Log specific error codes if provided by the API client
      console.error('OpenAI API Error Code:', error.code);
    }
    // Re-throw to allow higher-level handling if necessary
    throw new Error(`Failed to get response from AI for ${config.name}. Error: ${error.message}`);
  }
}

/**
 * Convert text to speech using ElevenLabs API
 * @param {string} text - The text to convert to speech
 * @param {string} voiceType - The persona (adina or rafa) to determine voice ID
 * @returns {Promise<Buffer>} - The audio buffer
 */
async function textToSpeech(text, voiceType = 'adina') {
  try {
    const voiceId = voiceType.toLowerCase() === 'adina' 
      ? process.env.ELEVENLABS_VOICE_ID_ADINA 
      : process.env.ELEVENLABS_VOICE_ID_RAFA;

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error in text-to-speech:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  generateToken,
  createSession,
  endSession,
  processTranscriptWithAI,
  textToSpeech
}; 