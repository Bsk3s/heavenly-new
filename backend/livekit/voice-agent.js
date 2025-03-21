/**
 * voice-agent.js
 * Handles real-time voice interactions using LiveKit
 */

const { Room, RoomEvent, RemoteParticipant, RemoteTrackPublication, RemoteTrack } = require('livekit-server-sdk');
const { Deepgram } = require('@deepgram/sdk');
const OpenAI = require('openai');
const axios = require('axios');
const WebSocket = require('ws');
const adinaConfig = require('../config/adina_agent.json');
const rafaConfig = require('../config/rafa_agent.json');

// Initialize Deepgram with the newer SDK format
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = new Deepgram(deepgramApiKey);

// Initialize OpenAI with the new library format
const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_API_KEY,
});

// Active connections for audio processing
const activeConnections = new Map();

/**
 * Create and configure a voice agent for real-time interactions
 * @param {string} persona - The persona to use ('adina' or 'rafa')
 * @param {string} roomName - The LiveKit room name
 * @returns {Object} - The agent connection details
 */
function createVoiceAgent(persona = 'adina', roomName) {
  // Select the appropriate persona configuration
  const personaConfig = persona.toLowerCase() === 'rafa' ? rafaConfig : adinaConfig;
  
  // Create a unique connection ID
  const connectionId = `${roomName}-${persona}-${Date.now()}`;
  
  // Store connection info
  const connection = {
    roomName,
    persona,
    personaConfig,
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
        model: 'nova-2',
        language: 'en',
        smart_format: true,
        interim_results: true,
        punctuate: true,
      };
      
      // Get a live transcription connection
      connection.deepgramSocket = await deepgram.listen.live(deepgramOptions);
      
      // Listen for transcription results
      connection.deepgramSocket.addListener('transcriptReceived', async (transcription) => {
        // Only process if we have a final result with speech
        if (transcription.is_final && transcription.channel.alternatives[0].transcript) {
          const transcript = transcription.channel.alternatives[0].transcript;
          connection.transcript += ' ' + transcript;
          
          // If not already processing, send to OpenAI
          if (!connection.isProcessing && connection.transcript.trim().length > 0) {
            connection.isProcessing = true;
            await processTranscriptWithAI(connection);
            connection.isProcessing = false;
            connection.transcript = '';
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
 * Process transcript with OpenAI and convert to speech
 * @param {Object} connection - Connection details
 */
async function processTranscriptWithAI(connection) {
  try {
    const { persona, personaConfig, transcript } = connection;
    
    // Get AI response using OpenAI with new library format
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4",
      messages: [
        { role: "system", content: personaConfig.systemPrompt },
        { role: "user", content: transcript }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const aiText = response.choices[0].message.content;
    
    // Get voice ID based on persona
    const voiceId = persona.toLowerCase() === 'adina' 
      ? process.env.ADINA_VOICE_ID 
      : process.env.RAFA_VOICE_ID;
    
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
        text: aiText,
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
    
    // TODO: Send the audio back to the LiveKit room
    // This will require additional implementation to publish audio track to LiveKit
    console.log(`Generated response for ${persona}: "${aiText}"`);
    
    return aiText;
  } catch (error) {
    console.error('Error processing transcript with AI:', error);
    return null;
  }
}

/**
 * Start a voice agent session
 * @param {string} roomName - The LiveKit room name
 * @param {string} persona - The persona to use ('adina' or 'rafa')
 * @returns {Promise<Object>} - The voice agent connection
 */
async function startVoiceAgentSession(roomName, persona = 'adina') {
  try {
    const { connectionId, connection } = createVoiceAgent(persona, roomName);
    
    console.log(`${persona} voice agent prepared for room: ${roomName}`);
    
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

module.exports = {
  createVoiceAgent,
  startVoiceAgentSession,
  processAudioStream,
  cleanupVoiceAgent
}; 