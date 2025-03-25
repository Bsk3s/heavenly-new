/**
 * voice-agent.js
 * Handles real-time voice interactions using LiveKit
 */

const { Room, RoomEvent, RemoteParticipant, RemoteTrackPublication, RemoteTrack } = require('livekit-server-sdk');
const { Deepgram } = require('@deepgram/sdk');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');
const WebSocket = require('ws');
const { injectPersonaPrompt, extractPersonaResponse } = require('../utils/injectPersonaPrompt');
const adinaConfig = require('../config/adina_agent.json');
const rafaConfig = require('../config/rafa_agent.json');

// Initialize Deepgram with v1 SDK format
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = new Deepgram(deepgramApiKey);

// Initialize OpenAI with better error handling
let openai;
try {
  // Try OpenAI v3 format first
  const { Configuration, OpenAIApi } = require('openai');
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
} catch (error) {
  console.error('Error initializing OpenAI v3 format:', error);
  // Fallback to another approach if needed
  throw new Error('Failed to initialize OpenAI. Check API key and SDK version.');
}

// Active connections for audio processing
const activeConnections = new Map();

/**
 * Create and configure a voice agent for real-time interactions
 * @param {string} persona - The persona to use ('adina' or 'rafa')
 * @param {string} roomName - The LiveKit room name
 * @param {string} sessionId - Optional user session ID for context persistence
 * @returns {Object} - The agent connection details
 */
function createVoiceAgent(persona = 'adina', roomName, sessionId = null) {
  // Select the appropriate persona configuration
  const personaConfig = persona.toLowerCase() === 'rafa' ? rafaConfig : adinaConfig;
  
  // Create a unique connection ID
  const connectionId = `${roomName}-${persona}-${Date.now()}`;

  // Store connection info
  const connection = {
    roomName,
    persona,
    personaConfig,
    sessionId,
    transcript: '',
    isProcessing: false,
    deepgramSocket: null,
    timestamp: Date.now()
  };

  activeConnections.set(connectionId, connection);

  return { connectionId, connection };
}

/**
 * Process audio through Deepgram, OpenAI, and ElevenLabs
 * @param {Buffer} audioChunk - Raw audio data
 * @param {Object} connection - Connection details
 */
async function processAudioStream(audioChunk, connection) {
  try {
    // If we don't have a Deepgram socket, create one
    if (!connection.deepgramSocket) {
      // Create Deepgram WebSocket for real-time transcription
      const deepgramOptions = {
        language: 'en',
        smart_format: true,
        interim_results: true,
        punctuate: true,
      };

      // Get a live transcription connection with v1 SDK
      connection.deepgramSocket = await deepgram.transcription.live(deepgramOptions);

      // Listen for transcription results
      connection.deepgramSocket.addListener('transcriptReceived', async (transcription) => {
        // Only process if we have a final result with speech
        if (transcription.is_final && transcription.channel.alternatives[0].transcript) {
          const transcript = transcription.channel.alternatives[0].transcript;
          connection.transcript += ' ' + transcript;

          // If not already processing, send to OpenAI
          if (!connection.isProcessing && connection.transcript.trim().length > 0) {
            connection.isProcessing = true;
            try {
              await processTranscriptWithAI(connection);
              connection.isProcessing = false;
              connection.transcript = '';
            } catch (error) {
              console.error('Error processing transcript with AI:', error);
              connection.isProcessing = false;
            }
          }
        }
      });
    }

    // Send audio chunk to Deepgram
    if (connection.deepgramSocket && connection.deepgramSocket.getReadyState() === 1) {
      connection.deepgramSocket.send(audioChunk);
    }
  } catch (error) {
    console.error('Error processing audio stream:', error);
  }
}

/**
 * Process a transcript with AI to generate a response
 * @param {Object} connection - Connection details
 */
async function processTranscriptWithAI(connection) {
  try {
    const { persona, personaConfig, transcript, sessionId } = connection;

    // Enhance prompt with persona context if we have a sessionId
    let promptedMessage = transcript;
    if (sessionId) {
      // Use our persona prompt utility to inject context and maintain session history
      promptedMessage = injectPersonaPrompt(transcript, personaConfig, sessionId);
    } else {
      // Simple system prompt injection if no session context
      promptedMessage = transcript;
    }

    // Get AI response using OpenAI with v3 SDK format
    const response = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL || "gpt-4",
      messages: [
        { role: "system", content: personaConfig.systemPrompt },
        { role: "user", content: promptedMessage }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const aiText = response.data.choices[0].message.content;

    // Store response in session history if we have a sessionId
    if (sessionId) {
      // Use extractPersonaResponse to clean and store the response
      const cleanedResponse = extractPersonaResponse(aiText, personaConfig, sessionId);
      // We don't need to do anything with cleanedResponse here since it's saved in memory
    }

    // Get voice ID based on persona
    const voiceId = persona.toLowerCase() === 'adina'
      ? process.env.ELEVENLABS_ADINA_VOICE_ID
      : process.env.ELEVENLABS_RAFA_VOICE_ID;

    if (!voiceId) {
      throw new Error(`No voice ID configured for persona: ${persona}`);
    }

    // Convert AI text to speech using ElevenLabs
    const audioBuffer = await textToSpeech(aiText, voiceId);

    return { text: aiText, audioBuffer };
  } catch (error) {
    console.error('Error processing transcript with AI:', error);
    throw new Error('Failed to process transcript with AI');
  }
}

/**
 * Start a voice agent session
 * @param {string} roomName - The LiveKit room name
 * @param {string} persona - The persona to use ('adina' or 'rafa')
 * @param {string} sessionId - Optional user session ID for context persistence
 * @returns {Promise<Object>} - The voice agent connection
 */
async function startVoiceAgentSession(roomName, persona = 'adina', sessionId = null) {
  try {
    const { connectionId, connection } = createVoiceAgent(persona, roomName, sessionId);

    console.log(`${persona} voice agent prepared for room: ${roomName}${sessionId ? ' with session context' : ''}`);

    return { connectionId, connection };
  } catch (error) {
    console.error(`Error starting ${persona} voice agent:`, error);
    throw error;
  }
}

/**
 * Clean up voice agent resources
 * @param {string} connectionId - The connection ID to clean up
 */
function cleanupVoiceAgent(connectionId) {
  if (activeConnections.has(connectionId)) {
    const connection = activeConnections.get(connectionId);

    // Close Deepgram socket if it exists
    if (connection.deepgramSocket) {
      connection.deepgramSocket.finish();
    }

    // Remove from active connections
    activeConnections.delete(connectionId);

    console.log(`Cleaned up voice agent: ${connectionId}`);
  }
}

/**
 * Convert text to speech using ElevenLabs
 * @param {string} text - The text to convert to speech
 * @param {string} voiceId - The ElevenLabs voice ID to use
 * @returns {Promise<Buffer>} - The audio buffer
 */
async function textToSpeech(text, voiceId) {
  try {
    // Convert to speech using ElevenLabs
    const elevenLabsResponse = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });

    console.log(`Generated audio response with ElevenLabs`);

    return elevenLabsResponse.data;
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw new Error('Failed to convert text to speech');
  }
}

module.exports = {
  createVoiceAgent,
  startVoiceAgentSession,
  processAudioStream,
  cleanupVoiceAgent
}; 