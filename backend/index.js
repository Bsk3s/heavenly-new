/**
 * index.js
 * Main entry point for the HeavenlyHub backend server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Import API handlers
const { handleAdinaChat } = require('./api/chat-adina');
const { handleRafaChat } = require('./api/chat-rafa');
const { startSession, endSession, getToken } = require('./api/voice-agent');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Set up API routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'HeavenlyHub Backend API',
    status: 'online',
    version: '1.0'
  });
});

// Chat endpoints
app.post('/api/chat/adina', handleAdinaChat);
app.post('/api/chat/rafa', handleRafaChat);

// LiveKit voice agent endpoints
app.post('/api/voice/start', startSession);
app.post('/api/voice/end', endSession);
app.get('/api/voice/token', getToken);

// Start the server
app.listen(PORT, () => {
  console.log(`HeavenlyHub backend server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 