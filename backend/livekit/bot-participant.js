/**
 * bot-participant.js
 * Handles LiveKit bot participant for audio injection
 */

const { Buffer } = require('buffer');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const axios = require('axios');
const deepgramService = require('../services/deepgram');
const { processTranscriptWithAI } = require('../api/voice-agent');
// Remove the circular dependency
// const { textToSpeech } = require('../api/voice-agent');

// Simple in-file version to avoid circular dependency
async function localTextToSpeech(text, voiceType) {
  try {
    // Determine voice ID based on persona
    const voiceId = voiceType === 'adina'
      ? process.env.ELEVENLABS_VOICE_ID_ADINA
      : process.env.ELEVENLABS_VOICE_ID_RAFA;

    // Use ElevenLabs API to generate speech
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(url,
      {
        text,
        model_id: "eleven_turbo_v2",
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
    console.error('Error in text-to-speech conversion:', error);
    throw error;
  }
}

class BotParticipant {
  constructor(roomName, persona = 'adina') {
    this.roomName = roomName;
    this.persona = persona;
    this.deepgramConnection = null;
    this.connectionId = null;
    this.isProcessingAudio = false;

    const wsUrl = process.env.LIVEKIT_WS_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    // Log the values being used to initialize RoomServiceClient
    console.log(`Initializing RoomServiceClient with:`);
    console.log(`  wsUrl: ${wsUrl}`);
    console.log(`  apiKey: ${apiKey ? apiKey.substring(0, 5) + '...' : 'undefined'}`);
    console.log(`  apiSecret: ${apiSecret ? apiSecret.substring(0, 5) + '...' + apiSecret.substring(apiSecret.length - 5) : 'undefined'}`);

    if (!wsUrl || !apiKey || !apiSecret) {
      console.error('FATAL: Missing LiveKit credentials for RoomServiceClient initialization!');
      // Optionally, throw an error here to prevent proceeding without credentials
      throw new Error('Missing LiveKit credentials for RoomServiceClient');
    }

    this.roomService = new RoomServiceClient(
      wsUrl,
      apiKey,
      apiSecret
    );
  }

  /**
   * Initialize Deepgram connection for audio processing
   */
  async initializeDeepgram() {
    try {
      // Create unique connection ID for this session
      this.connectionId = `${this.roomName}-${Date.now()}`;
      console.log(`Initializing Deepgram connection: ${this.connectionId}`);

      // Initialize Deepgram connection
      this.deepgramConnection = await deepgramService.initializeConnection(this.connectionId);

      // Handle transcripts
      this.deepgramConnection.addListener('transcript', async (transcript) => {
        try {
          console.log(`Received transcript: ${transcript}`);

          // Process transcript with OpenAI
          const response = await processTranscriptWithAI(transcript, {
            persona: this.persona,
            roomName: this.roomName
          });

          // Convert response to speech and inject into room
          if (response && response.text) {
            const audioBuffer = await localTextToSpeech(response.text, this.persona);
            await this.notifyParticipants(await this.getAudioUrl(audioBuffer));
          }
        } catch (error) {
          console.error('Error processing transcript:', error);
        }
      });

      console.log('Deepgram connection initialized successfully');
    } catch (error) {
      console.error('Error initializing Deepgram:', error);
      throw error;
    }
  }

  /**
   * Handle incoming audio data from LiveKit
   * @param {Buffer} audioData - Raw audio data
   */
  async handleAudioData(audioData) {
    try {
      if (!this.deepgramConnection) {
        await this.initializeDeepgram();
      }

      if (!this.isProcessingAudio) {
        this.isProcessingAudio = true;
        await deepgramService.processAudio(this.connectionId, audioData);
        this.isProcessingAudio = false;
      }
    } catch (error) {
      console.error('Error handling audio data:', error);
      this.isProcessingAudio = false;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.deepgramConnection) {
        deepgramService.cleanupConnection(this.connectionId);
        this.deepgramConnection = null;
        this.connectionId = null;
      }
      await this.disconnect();
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }

  /**
   * Connect to the LiveKit room
   */
  async connect() {
    try {
      console.log(`Creating/joining room for ${this.persona} bot: ${this.roomName}`);

      // Create room if it doesn't exist
      try {
        await this.roomService.createRoom({
          name: this.roomName,
          emptyTimeout: 10 * 60, // 10 minutes
          maxParticipants: 4,
          metadata: JSON.stringify({
            persona: this.persona,
            type: 'voice-agent'
          })
        });
        console.log(`Room ${this.roomName} created or already exists.`);
      } catch (createRoomError) {
        console.error(`Error calling roomService.createRoom for room ${this.roomName}:`, createRoomError);
        throw createRoomError;
      }

      // Generate token for bot
      const botIdentity = `${this.persona}-bot`;
      const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        { identity: botIdentity }
      );

      at.addGrant({
        roomJoin: true,
        room: this.roomName,
        canPublish: true,
        canSubscribe: true
      });

      const token = at.toJwt();
      console.log(`Generated token for bot: ${botIdentity}`);

      // Initialize Deepgram when connecting
      await this.initializeDeepgram();

      // Set up participant monitoring
      try {
        // Get current participants
        const participants = await this.roomService.listParticipants(this.roomName);
        console.log(`Current participants in room: ${participants.length}`);

        // Subscribe to their audio tracks
        for (const participant of participants) {
          if (participant.identity !== botIdentity) {
            console.log(`Found participant: ${participant.identity}`);
            // Subscribe to all tracks
            await this.roomService.updateSubscriptions(
              this.roomName,
              botIdentity,
              [{ participantIdentity: participant.identity, subscribe: true }]
            );
          }
        }

        // Set up periodic participant check (every 5 seconds)
        global.setInterval(async () => {
          try {
            const currentParticipants = await this.roomService.listParticipants(this.roomName);
            // Handle any new participants here
            for (const participant of currentParticipants) {
              if (participant.identity !== botIdentity) {
                console.log(`Checking participant: ${participant.identity}`);
                // Subscribe to all tracks
                await this.roomService.updateSubscriptions(
                  this.roomName,
                  botIdentity,
                  [{ participantIdentity: participant.identity, subscribe: true }]
                );
              }
            }
          } catch (error) {
            console.error('Error checking participants:', error);
          }
        }, 5000);

      } catch (error) {
        console.error('Error setting up participant monitoring:', error);
        throw error;
      }

      return token;
    } catch (error) {
      console.error('Error connecting bot participant:', error);
      throw error;
    }
  }

  /**
   * Get audio URL for the client
   * @param {Buffer} audioBuffer - The audio buffer to serve
   * @returns {string} - URL to access the audio
   */
  async getAudioUrl(audioBuffer) {
    // In a production environment, you would:
    // 1. Save the audio buffer to a temporary file or cloud storage
    // 2. Generate a signed URL for the client to access
    // 3. Set up proper cleanup of temporary files

    // For now, we'll return the audio buffer directly
    // The client will need to handle base64 audio data
    return `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
  }

  /**
   * Notify participants about new audio
   * @param {string} audioUrl - URL to access the audio
   */
  async notifyParticipants(audioUrl) {
    try {
      console.log('\n========== AUDIO NOTIFICATION START ==========');
      console.log('Room:', this.roomName);
      console.log('Bot identity:', `${this.persona}-bot`);

      // Get current participants
      const participants = await this.roomService.listParticipants(this.roomName);
      console.log(`Found ${participants.length} participants in room`);

      if (participants.length === 0) {
        console.warn('No participants found in room');
        return;
      }

      // Create optimized notification data
      const notificationData = {
        type: 'audio',
        url: audioUrl,
        persona: this.persona,
        timestamp: Date.now()
      };

      // Send audio notification to all participants
      await this.roomService.sendData(
        this.roomName,
        Buffer.from(JSON.stringify(notificationData)),
        'application/json',
        [] // Empty array broadcasts to all participants
      );

      console.log('Audio notification sent successfully');
      console.log('===========================================\n');
    } catch (error) {
      console.error('Error in notifyParticipants:', error);
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Disconnect from the room
   */
  async disconnect() {
    try {
      // Remove bot from room
      const botIdentity = `${this.persona}-bot`;
      await this.roomService.removeParticipant(this.roomName, botIdentity);
      console.log(`Bot ${botIdentity} removed from room: ${this.roomName}`);
    } catch (error) {
      console.error('Error disconnecting bot:', error);
      throw error;
    }
  }
}

/**
 * Test audio injection directly (bypassing the API)
 * Used for testing the LiveKit connection directly
 */
async function directTestAudio(roomName) {
  try {
    console.log('========== DIRECT TEST AUDIO START ==========');
    console.log(`Initiating direct audio test for room: ${roomName}`);

    // Create bot if it doesn't exist
    console.log('Creating bot participant...');
    const bot = new BotParticipant(roomName);

    // Connect bot to the room
    console.log('Connecting bot to room...');
    const token = await bot.connect();
    console.log(`Bot connected with token: ${token.substring(0, 20)}...`);

    // Sample audio message (base64 encoded MP3)
    const audioMessage = "This is a test audio message from the LiveKit bot participant.";
    console.log('Test message:', audioMessage);

    try {
      // First try sending a simple text message as a test
      console.log('Sending a simple text message first as a test...');
      const testData = {
        type: 'text',
        message: 'This is a test text message',
        timestamp: new Date().toISOString()
      };

      // Get participants to verify they exist
      const participants = await bot.roomService.listParticipants(roomName);
      console.log(`Before sending, room has ${participants.length} participants`);

      // Send test message to all participants
      await bot.roomService.sendData(
        roomName,
        Buffer.from(JSON.stringify(testData)),
        'application/json',
        [] // Empty array means send to all participants
      );
      console.log('Simple text message sent successfully');
    } catch (textError) {
      console.error('Error sending test text message:', textError);
      // Continue with audio test regardless
    }

    // Convert to speech using ElevenLabs
    console.log('Converting text to speech...');
    const voiceType = 'adina'; // or 'rafa'

    // Get audio from ElevenLabs using local function
    console.log('Calling textToSpeech function...');
    const audioBuffer = await localTextToSpeech(audioMessage, voiceType);
    console.log(`Received audio buffer of size: ${audioBuffer.byteLength} bytes`);

    // Get audio URL
    console.log('Converting audio buffer to URL...');
    const audioUrl = await bot.getAudioUrl(audioBuffer);
    console.log(`Generated audio URL of length: ${audioUrl.length}`);
    console.log(`Audio URL starts with: ${audioUrl.substring(0, 30)}...`);

    // Send to participants
    console.log('Sending audio to participants...');
    await bot.notifyParticipants(audioUrl);

    console.log('Direct audio test completed for room:', roomName);
    console.log('========== DIRECT TEST AUDIO END ==========');
    return { success: true, message: 'Audio test completed' };
  } catch (error) {
    console.error('========== DIRECT TEST AUDIO ERROR ==========');
    console.error('Direct audio test error:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    console.error('===========================================');
    return { success: false, error: error.message };
  }
}

module.exports = {
  BotParticipant,
  directTestAudio
}; 