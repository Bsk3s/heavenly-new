/**
 * chat-rafa.js
 * Handles API interactions for the Rafa persona chat functionality
 */

const { Configuration, OpenAIApi } = require('openai');
const { injectPersonaPrompt, extractPersonaResponse } = require('../utils/injectPersonaPrompt');
const { streamToTTS } = require('../utils/streamToTTS');
const rafaConfig = require('../config/rafa_agent.json');

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
    
    // Inject the persona-specific prompt
    const promptedMessage = injectPersonaPrompt(message, rafaConfig);
    
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
 * Call to OpenAI GPT service
 * @param {string} systemPrompt - The processed system prompt
 * @param {string} userMessage - The original user message
 * @param {string} sessionId - The session ID for conversation context
 * @returns {string} - The LLM response
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
    return extractPersonaResponse(reply, rafaConfig);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to get response from OpenAI');
  }
}

module.exports = {
  handleRafaChat
}; 