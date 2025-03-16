/**
 * voice-agent.js
 * Handles real-time voice interactions using LiveKit's MultimodalAgent
 */

const { MultimodalAgent } = require('@livekit/agents');
const { injectPersonaPrompt } = require('../utils/injectPersonaPrompt');
const adinaConfig = require('../config/adina_agent.json');
const rafaConfig = require('../config/rafa_agent.json');

/**
 * Create and configure a LiveKit MultimodalAgent for real-time voice interactions
 * @param {string} persona - The persona to use ('adina' or 'rafa')
 * @returns {MultimodalAgent} - The configured agent
 */
function createVoiceAgent(persona = 'adina') {
  // Select the appropriate persona configuration
  const personaConfig = persona.toLowerCase() === 'rafa' ? rafaConfig : adinaConfig;
  
  // Create the agent with OpenAI Realtime API
  const agent = new MultimodalAgent({
    // LiveKit connection details
    url: process.env.LIVEKIT_URL,
    token: process.env.LIVEKIT_TOKEN,
    
    // OpenAI configuration
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o',
      systemPrompt: personaConfig.systemPrompt,
    },
    
    // Voice settings
    voice: {
      voice: personaConfig.voiceSettings.voice || persona.toLowerCase(),
      speed: personaConfig.voiceSettings.speed || 1.0,
      pitch: personaConfig.voiceSettings.pitch || 1.0,
    },
    
    // Agent behavior settings
    agentName: personaConfig.name,
    useOpenAIRealtime: true,
    enableRealTimeTranscript: true,
  });
  
  return agent;
}

/**
 * Start a voice agent session
 * @param {string} roomName - The LiveKit room name
 * @param {string} persona - The persona to use ('adina' or 'rafa')
 * @returns {Promise<void>}
 */
async function startVoiceAgentSession(roomName, persona = 'adina') {
  try {
    const agent = createVoiceAgent(persona);
    
    // Connect the agent to the room
    await agent.connect(roomName);
    
    console.log(`${persona} voice agent connected to room: ${roomName}`);
    
    // Handle agent disconnection
    agent.on('disconnected', () => {
      console.log(`${persona} voice agent disconnected from room: ${roomName}`);
    });
    
    return agent;
  } catch (error) {
    console.error(`Error starting ${persona} voice agent:`, error);
    throw error;
  }
}

module.exports = {
  createVoiceAgent,
  startVoiceAgentSession
}; 