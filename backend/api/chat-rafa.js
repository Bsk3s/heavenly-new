/**
 * chat-rafa.js
 * Handles API interactions for the Rafa persona chat functionality
 */

const OpenAI = require('openai');
const { injectPersonaPrompt, extractPersonaResponse } = require('../utils/injectPersonaPrompt');
const { streamToTTS } = require('../utils/streamToTTS');
const rafaConfig = require('../config/rafa_agent.json');

// Initialize OpenAI with the new library format
const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET_API_KEY,
});

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
 * Call the LLM service to get a response from Rafa
 * @param {string} systemPrompt - The system prompt for the AI
 * @param {string} userMessage - The user's message
 * @param {string} sessionId - The session ID
 * @returns {Promise<string>} - The AI's response
 */
async function callLLMService(systemPrompt, userMessage, sessionId) {
  try {
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.8,
    });

    const reply = gptResponse.choices[0].message.content;
    
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