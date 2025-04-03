/**
 * chat-rafa.js
 * Handles API interactions for the Rafa persona chat functionality
 */

let openai;
try {
  // Initialize OpenAI with the new SDK format
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI initialized with new SDK format');
} catch (error) {
  console.error('Error initializing OpenAI:', error);
  // Fallback to a mock implementation for testing
  openai = {
    createChatCompletion: async () => ({
      data: {
        choices: [{ message: { content: 'Test response from mock OpenAI (API initialization failed)' } }]
      }
    })
  };
  console.warn('Using mock OpenAI implementation');
}

const { injectPersonaPrompt, extractPersonaResponse } = require('../utils/injectPersonaPrompt');
const { streamToTTS } = require('../utils/streamToTTS');
const rafaConfig = require('../config/rafa_agent.json');

/**
 * Process a chat message with the Rafa persona
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
async function handleRafaChat(req, res) {
  try {
    const { message, sessionId, voiceEnabled = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Inject the persona-specific prompt with session context
    const promptedMessage = injectPersonaPrompt(message, rafaConfig, sessionId);

    // Call OpenAI API
    const response = await callLLMService(promptedMessage, message, sessionId);

    if (voiceEnabled) {
      // Stream the response to TTS service
      return streamToTTS(response, res);
    }

    // Return text response
    return res.status(200).json({
      response: response,
      persona: 'rafa'
    });

  } catch (error) {
    console.error('[Rafa API ERROR]', error);
    return res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
}

/**
 * Call the LLM service to get a response from Rafa
 * @param {string} systemPrompt - The system prompt for the AI
 * @param {string} userMessage - The user's message
 * @param {string} sessionId - The session ID
 * @returns {Promise<string>} - The AI's response
 */
async function callLLMService(systemPrompt, userMessage, sessionId) {
  try {
    // Check if we're using the mock implementation
    if (openai.createChatCompletion && !openai.chat) {
      // Old SDK mockup
      const gptResponse = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
      });
      
      const reply = gptResponse.data.choices[0].message.content;
      return extractPersonaResponse(reply, rafaConfig, sessionId);
    } else {
      // New SDK format
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
      });
      
      const reply = completion.choices[0].message.content;
      return extractPersonaResponse(reply, rafaConfig, sessionId);
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to get response from OpenAI');
  }
}

module.exports = {
  handleRafaChat
}; 