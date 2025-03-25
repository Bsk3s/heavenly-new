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
const { startSession, endSession, getToken, testConnection } = require('./api/voice-agent');

// Initialize Express app
const app = express();

// Trust proxy - this is important for Render
app.set('trust proxy', true);

// Configure middleware with proper CORS for production
const corsOptions = {
  origin: '*',  // Allow all origins temporarily for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Configure all middleware in the correct order
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add request logging middleware
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
console.log('Created API router');

// Add test endpoint to API router
apiRouter.get('/test', (req, res) => {
  console.log('API test endpoint hit');
  res.json({
    message: 'API test endpoint working',
    time: new Date().toISOString()
  });
});

// Create voice router
const voiceRouter = express.Router();
console.log('Created voice router');

// Set up voice routes
voiceRouter.post('/start', (req, res, next) => {
  console.log('Voice start endpoint hit');
  startSession(req, res, next);
});

voiceRouter.post('/end', (req, res, next) => {
  console.log('Voice end endpoint hit');
  endSession(req, res, next);
});

voiceRouter.get('/token', (req, res, next) => {
  console.log('Voice token endpoint hit');
  getToken(req, res, next);
});

voiceRouter.get('/test-connection', (req, res, next) => {
  console.log('\n=== TEST CONNECTION ENDPOINT HIT ===');
  console.log('Time:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  testConnection(req, res).catch(err => {
    console.error('Error in test connection:', err);
    next(err);
  });
});

// Mount voice router on API router
apiRouter.use('/voice', voiceRouter);
console.log('Mounted voice router at /api/voice');

// Add chat endpoints to API router
apiRouter.post('/chat/adina', handleAdinaChat);
apiRouter.post('/chat/rafa', handleRafaChat);
console.log('Registered chat endpoints');

// Mount API router
app.use('/api', apiRouter);
console.log('Mounted API router at /api');

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
  console.error('===================\n');
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    time: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== SERVER STARTED ===`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Memory Usage: ${JSON.stringify(process.memoryUsage())}`);
  console.log(`===================\n`);
  
  // Log all registered routes
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

// Voice test connection route
app.get('/api/voice/test-connection', async (req, res) => {
  console.log('Test connection endpoint hit');
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a detailed diagnostic endpoint
app.get('/api/diagnostics', (req, res) => {
  console.log('Diagnostics endpoint hit');
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || '4000',
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? 
      `${process.env.LIVEKIT_API_KEY.substring(0, 3)}...${process.env.LIVEKIT_API_KEY.substring(process.env.LIVEKIT_API_KEY.length - 3)}` : 
      'not set',
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ? 
      `${process.env.LIVEKIT_API_SECRET.substring(0, 3)}...` : 
      'not set',
    LIVEKIT_WS_URL: process.env.LIVEKIT_WS_URL || 'not set',
    HAS_LIVEKIT_SDK: typeof AccessToken !== 'undefined' ? 'yes' : 'no',
  };

  // Get registered routes
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(',')
      });
    } else if (middleware.name === 'router') {
      // Routes added via router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const baseRoute = middleware.regexp.toString()
            .replace('\\/?(?=\\/|$)', '')
            .replace(/^\/\^\\\//, '/')
            .replace(/\\\/\$\/$/, '');
          const path = baseRoute.replace(/\\\//g, '/') + handler.route.path;
          routes.push({
            path: path,
            methods: Object.keys(handler.route.methods).join(',')
          });
        }
      });
    }
  });

  res.json({
    server: {
      version: '1.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime() + ' seconds',
      memory: process.memoryUsage(),
    },
    environment: env,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    livekit_test: {
      run_test: '/api/voice/test-connection',
      get_token: '/api/voice/token?roomName=test-room&participantName=test-user'
    }
  });
}); 