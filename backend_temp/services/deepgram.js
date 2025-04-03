const { Deepgram } = require('@deepgram/sdk');
const { createReadStream } = require('fs');

class DeepgramService {
  constructor() {
    this.deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
    this.connections = new Map();
  }

  /**
   * Initialize a real-time transcription connection
   * @param {string} connectionId - Unique identifier for this connection
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - The Deepgram connection
   */
  async initializeConnection(connectionId, options = {}) {
    try {
      const connection = await this.deepgram.transcription.live({
        language: 'en',
        smart_format: true,
        model: 'nova-2',
        ...options
      });

      // Store the connection
      this.connections.set(connectionId, connection);

      // Set up event handlers
      connection.addListener('transcriptReceived', (transcription) => {
        this.handleTranscript(connectionId, transcription);
      });

      connection.addListener('error', (error) => {
        this.handleError(connectionId, error);
      });

      return connection;
    } catch (error) {
      console.error(`Error initializing Deepgram connection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle incoming transcripts
   * @param {string} connectionId - The connection ID
   * @param {Object} transcription - The transcription data
   */
  handleTranscript(connectionId, transcription) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      // Process the transcript
      const transcript = transcription.channel.alternatives[0].transcript;
      if (transcript) {
        // Emit the transcript for further processing
        connection.emit('transcript', transcript);
      }
    } catch (error) {
      console.error(`Error handling transcript: ${error.message}`);
    }
  }

  /**
   * Handle Deepgram errors
   * @param {string} connectionId - The connection ID
   * @param {Error} error - The error object
   */
  handleError(connectionId, error) {
    console.error(`Deepgram error for connection ${connectionId}:`, error);
    this.cleanupConnection(connectionId);
  }

  /**
   * Clean up a connection
   * @param {string} connectionId - The connection ID to clean up
   */
  cleanupConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.finish();
      this.connections.delete(connectionId);
    }
  }

  /**
   * Process audio data
   * @param {string} connectionId - The connection ID
   * @param {Buffer} audioData - The audio data to process
   */
  async processAudio(connectionId, audioData) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error(`No active connection found for ID: ${connectionId}`);
      }

      await connection.send(audioData);
    } catch (error) {
      console.error(`Error processing audio: ${error.message}`);
      this.handleError(connectionId, error);
    }
  }
}

module.exports = new DeepgramService(); 