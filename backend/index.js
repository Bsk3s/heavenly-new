/**
 * index.js
 * Main entry point for the HeavenlyHub backend server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { AccessToken } = require('livekit-server-sdk');
const https = require('https');
const http = require('http');
const fs = require('fs');

// Import API handlers
const { handleAdinaChat } = require('./api/chat-adina');
const { handleRafaChat } = require('./api/chat-rafa');
const voiceRouter = require('./api/voice-agent');

// --- Environment Variable Check ---
console.log('\n=== ENVIRONMENT VARIABLE CHECK ===');
const checkEnvVar = (name, isSecret = false) => {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    console.error(`❌ ${name}: Missing or empty!`);
    return false;
  } else {
    if (isSecret) {
      const maskedValue = value.length > 6 
        ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` 
        : '******';
      console.log(`✅ ${name}: Present (Value: ${maskedValue})`);
    } else {
      console.log(`✅ ${name}: Present (Value: ${value})`);
    }
    return true;
  }
};

let allVarsPresent = true;
allVarsPresent = checkEnvVar('LIVEKIT_API_KEY', true) && allVarsPresent;
allVarsPresent = checkEnvVar('LIVEKIT_API_SECRET', true) && allVarsPresent;
allVarsPresent = checkEnvVar('LIVEKIT_WS_URL') && allVarsPresent;
allVarsPresent = checkEnvVar('DEEPGRAM_API_KEY', true) && allVarsPresent;
allVarsPresent = checkEnvVar('OPENAI_API_KEY', true) && allVarsPresent;
allVarsPresent = checkEnvVar('ELEVENLABS_API_KEY', true) && allVarsPresent;
allVarsPresent = checkEnvVar('ELEVENLABS_VOICE_ID_ADINA') && allVarsPresent;
allVarsPresent = checkEnvVar('ELEVENLABS_VOICE_ID_RAFA') && allVarsPresent;

if (!allVarsPresent) {
  console.error('🚨 CRITICAL: One or more required environment variables are missing. Please check your .env file or system configuration.');
  // Optionally, you might want to exit if critical variables are missing
  // process.exit(1); 
}
console.log('================================\n');
// --- End Environment Variable Check ---

// Initialize Express app
const app = express();

// Trust proxy - this is important for Render
app.set('trust proxy', true);

// Configure middleware with proper CORS for production
const corsOptions = {
  origin: '*',  // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Configure all middleware in the correct order
app.use(cors(corsOptions));

// Add OPTIONS handler for preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Add request logging middleware at the very beginning
app.use((req, res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('========================\n');
  next();
});

// Create base router for all API routes
const apiRouter = express.Router();
console.log('✅ Created apiRouter');

// Add test endpoint to API router
apiRouter.get('/test', (req, res) => {
  console.log('API test endpoint hit');
  res.json({
    message: 'API test endpoint working',
    time: new Date().toISOString()
  });
});
console.log('   mounted /test onto apiRouter');

// Mount voice router on API router
console.log('❓ Attempting to mount voiceRouter onto apiRouter...');
console.log('  -> Is voiceRouter defined?', typeof voiceRouter !== 'undefined');
console.log('  -> Is voiceRouter a function (router)?', typeof voiceRouter === 'function');
apiRouter.use('/voice', voiceRouter);
console.log('✅ Mounted voice router at /api/voice');

// Add chat endpoints to API router
apiRouter.post('/chat/adina', handleAdinaChat);
apiRouter.post('/chat/rafa', handleRafaChat);
console.log('✅ Registered chat endpoints on apiRouter');

// Mount API router
console.log('❓ Attempting to mount apiRouter onto app...');
app.use('/api', apiRouter);
console.log('✅ Mounted API router at /api');

// Define testConnection function
const testConnection = async () => {
  try {
    console.log('Generating test token...');
    console.log('LIVEKIT_API_KEY:', process.env.LIVEKIT_API_KEY ? 'Set' : 'Not set');
    console.log('LIVEKIT_API_SECRET:', process.env.LIVEKIT_API_SECRET ? 'Set' : 'Not set');
    console.log('LIVEKIT_WS_URL:', process.env.LIVEKIT_WS_URL || 'Not set');

    // Generate a test token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: 'test-user',
        name: 'Test User',
        ttl: 60 * 60 * 2, // 2 hours
      }
    );

    // Add permissions
    at.addGrant({
      room: 'hb_room_52', // Changed from 'test-room' to match frontend
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    // Generate the token
    const token = at.toJwt();
    console.log('Token generated successfully');

    return {
      success: true,
      wsUrl: process.env.LIVEKIT_WS_URL,
      testToken: token,
      roomName: 'hb_room_52' // Changed from 'test-room' to match frontend
    };
  } catch (error) {
    console.error('Error generating test token:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

// Voice test connection route
app.get('/api/voice/test-connection', async (req, res) => {
  console.log('Test connection endpoint hit');
  try {
    const result = await testConnection();
    console.log('Test connection successful:', result);
    res.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.json({
    message: 'HeavenlyHub Backend API',
    status: 'online',
    version: '1.0',
    endpoints: {
      root: '/',
      api: {
        test: '/api/test',
        voice: {
          testConnection: '/api/voice/test-connection',
          start: '/api/voice/start',
          end: '/api/voice/end',
          token: '/api/voice/token'
        },
        chat: {
          adina: '/api/chat/adina',
          rafa: '/api/chat/rafa'
        }
      }
    }
  });
});

// Add 404 handler
app.use((req, res) => {
  console.log('\n=== 404 NOT FOUND ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    time: new Date().toISOString(),
    availableEndpoints: {
      root: '/',
      api: {
        test: '/api/test',
        voice: {
          testConnection: '/api/voice/test-connection',
          start: '/api/voice/start',
          end: '/api/voice/end',
          token: '/api/voice/token'
        },
        chat: {
          adina: '/api/chat/adina',
          rafa: '/api/chat/rafa'
        }
      }
    }
  });
});

// Add error handler
app.use((err, req, res, next) => {
  console.error('\n=== ERROR HANDLER ===');
  console.error('Time:', new Date().toISOString());
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('Request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  console.error('===================\n');

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    time: new Date().toISOString()
  });
});

// Determine which type of server to use based on environment
let server;
if (process.env.NODE_ENV === 'production') {
  // In production, use HTTPS with proper certificates
  console.log('Starting HTTPS server for production...');
  const httpsOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'cert.key')),
    cert: fs.readFileSync(path.join(process.cwd(), 'cert.crt')),
    ca: fs.readFileSync(path.join(process.cwd(), 'ca.crt')),
  };
  server = https.createServer(httpsOptions, app);
} else {
  // In development, use HTTP for easier testing
  console.log('Starting HTTP server for development...');
  server = http.createServer(app);
}

// Start the server
const PORT = process.env.PORT || 4001;
server.listen(PORT, '0.0.0.0', () => {
  const allAddresses = Object.values(require('os').networkInterfaces())
    .flat()
    .filter(item => !item.internal && item.family === 'IPv4')
    .map(item => item.address);

  const now = new Date().toISOString();
  console.log('\n=== SERVER STARTED ===');
  console.log('Time:', now);
  console.log('Port:', PORT);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('URL: https://localhost:' + PORT);
    console.log('URL: https://127.0.0.1:' + PORT);
    allAddresses.forEach(addr => {
      console.log('URL: https://' + addr + ':' + PORT);
    });
  } else {
    console.log('URL: http://localhost:' + PORT);
    console.log('URL: http://127.0.0.1:' + PORT);
    allAddresses.forEach(addr => {
      console.log('URL: http://' + addr + ':' + PORT);
    });
  }
  
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Process ID:', process.pid);
  console.log('Memory Usage:', process.memoryUsage());
  console.log('===================');
  
  // Print out all registered routes for debugging
  console.log('\n=== REGISTERED ROUTES ===');
  app._router.stack.forEach((layer, i) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',');
      console.log(`${i}: [${methods.toUpperCase()}] ${layer.route.path}`);
    } else if (layer.name === 'router') {
      console.log(`${i}: [Router] ${layer.regexp}`);
      if (layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach((handler, j) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods).join(',');
            const path = handler.route.path;
            console.log(`  ${j}: [${methods.toUpperCase()}] ${path}`);
          }
        });
      }
    }
  });
  console.log('=========================\n');
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
