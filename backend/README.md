# HeavenlyHub Backend

This is the backend server for the HeavenlyHub application, providing API endpoints for chat interactions with AI personas, speech-to-text transcription, and real-time voice agent functionality.

## Features

- Chat API for Adina and Rafa personas
- Speech-to-text transcription using OpenAI Whisper
- Real-time voice interactions using LiveKit and OpenAI Realtime API
- Firebase integration for authentication and data storage

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key
   FIREBASE_SERVICE_ACCOUNT_PATH=path_to_service_account_json
   FIREBASE_DATABASE_URL=your_firebase_database_url
   LIVEKIT_URL=your_livekit_url
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Chat API

- **POST /api/chat/adina**

  - Body: `{ "message": "Your message", "sessionId": "optional-session-id", "voiceEnabled": false }`
  - Response: `{ "response": "Adina's response", "persona": "adina" }`

- **POST /api/chat/rafa**
  - Body: `{ "message": "Your message", "sessionId": "optional-session-id", "voiceEnabled": false }`
  - Response: `{ "response": "Rafa's response", "persona": "rafa" }`

### Speech-to-Text API

- **POST /api/transcribe**
  - Form data: `audio` (file)
  - Response: `{ "transcription": "Transcribed text", "success": true }`

### Voice Agent API

- **POST /api/voice/start**

  - Body: `{ "persona": "adina" }`
  - Response: `{ "roomName": "voice-adina-uuid", "persona": "adina", "success": true }`

- **POST /api/voice/end**

  - Body: `{ "roomName": "voice-adina-uuid" }`
  - Response: `{ "success": true, "message": "Voice agent session ended for room: voice-adina-uuid" }`

- **GET /api/voice/token?roomName=voice-adina-uuid&participantName=user**
  - Response: `{ "token": "livekit-token", "roomName": "voice-adina-uuid", "participantName": "user" }`

## LiveKit Integration

This backend uses LiveKit for real-time voice interactions. To set up LiveKit:

1. Create a LiveKit account at [https://livekit.io/](https://livekit.io/)
2. Set up a LiveKit project and get your API key and secret
3. Update your `.env` file with the LiveKit URL, API key, and secret

For more information on LiveKit Agents, see the [LiveKit Agents documentation](https://docs.livekit.io/agents/).
