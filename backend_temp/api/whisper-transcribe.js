/**
 * whisper-transcribe.js
 * Handles API interactions for speech-to-text transcription using OpenAI's Whisper
 */

const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Process an audio file and convert it to text
 * @param {Object} req - The request object containing the audio file
 * @param {Object} res - The response object
 */
async function transcribeAudio(req, res) {
  try {
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.file;
    
    // Call OpenAI Whisper API
    const transcription = await callWhisperAPI(audioFile);
    
    return res.status(200).json({ 
      transcription: transcription,
      success: true
    });
    
  } catch (error) {
    console.error('[Whisper API ERROR]', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}

/**
 * Call to OpenAI's Whisper API
 * @param {Object} audioFile - The audio file to transcribe
 * @returns {string} - The transcribed text
 */
async function callWhisperAPI(audioFile) {
  try {
    // Create a readable stream from the file buffer
    const tempFilePath = path.join('/tmp', `${Date.now()}-${audioFile.originalname}`);
    fs.writeFileSync(tempFilePath, audioFile.buffer);
    
    // Create a file stream to send to OpenAI
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Call the Whisper API
    const response = await openai.createTranscription(
      fileStream,
      'whisper-1',
      undefined,
      'text'
    );
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    return response.data.text;
  } catch (error) {
    console.error('Error calling Whisper API:', error);
    throw new Error('Failed to transcribe audio with Whisper API');
  }
}

module.exports = {
  transcribeAudio
}; 