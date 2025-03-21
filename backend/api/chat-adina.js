/**
 * chat-adina.js
 * Handles API interactions for the Adina persona chat functionality
 */

let openai;
try {
  // Try OpenAI v3 format first
  const { Configuration, OpenAIApi } = require('openai');
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
} catch (error) {
  console.error('Error initializing OpenAI v3 format:', error);
  // Fallback to another approach if needed
  throw new Error('Failed to initialize OpenAI. Check API key and SDK version.');
}

const { injectPersonaPrompt, extractPersonaResponse } = require('../utils/injectPersonaPrompt');
const { streamToTTS } = require('../utils/streamToTTS');
const adinaConfig = require('../config/adina_agent.json');

/**
 * Process a chat message with the Adina persona
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function handleAdinaChat(req, res) {
  try {
    const { message, sessionId, voiceEnabled = false } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Inject the persona-specific prompt
    const promptedMessage = injectPersonaPrompt(message, adinaConfig);
    
    // Call OpenAI API
    const response = await callLLMService(promptedMessage, message, sessionId);
    
    if (voiceEnabled) {
      // Stream the response to TTS service
      return streamToTTS(response, res);
    }
    
    // Return text response
    return res.status(200).json({ 
      response: response,
      persona: 'adina'
    });
    
  } catch (error) {
    console.error('[Adina API ERROR]', error);
    return res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
}

/**
 * Call the LLM service to get a response from Adina
 * @param {string} systemPrompt - The system prompt for the AI
 * @param {string} userMessage - The user's message
 * @param {string} sessionId - The session ID
 * @returns {Promise<string>} - The AI's response
 */
async function callLLMService(systemPrompt, userMessage, sessionId) {
  try {
    const gptResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.8,
    });

    const reply = gptResponse.data.choices[0].message.content;
    
    // Clean up the response if needed
    return extractPersonaResponse(reply, adinaConfig);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to get response from OpenAI');
  }
}

module.exports = {
  handleAdinaChat
}; 