require('dotenv').config();
const deepgramService = require('./services/deepgram');
const fs = require('fs');
const path = require('path');

async function testDeepgram() {
  try {
    console.log('Starting Deepgram test...');
    
    // Create a test connection ID
    const connectionId = 'test-connection-' + Date.now();
    
    // Initialize Deepgram connection
    const connection = await deepgramService.initializeConnection(connectionId);
    
    // Set up transcript handler
    connection.on('transcript', (transcript) => {
      console.log('Received transcript:', transcript);
    });
    
    // Read and process test audio file
    const audioFile = path.join(process.cwd(), 'test-audio.wav');
    const audioData = fs.readFileSync(audioFile);
    
    // Process the audio
    console.log('Processing test audio...');
    await deepgramService.processAudio(connectionId, audioData);
    
    // Clean up after a delay
    global.setTimeout(() => {
      console.log('Cleaning up...');
      deepgramService.cleanupConnection(connectionId);
      console.log('Test completed successfully');
    }, 5000);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDeepgram(); 