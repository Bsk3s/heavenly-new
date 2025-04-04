/**
 * injectPersonaPrompt.js
 * Utility to inject persona-specific prompts into user messages
 */

// Simple in-memory storage for conversation history
// In production, this should be replaced with a proper database
const conversationMemory = new Map();

/**
 * Adds a message to the conversation history for a user session
 * @param {string} sessionId - The user's session ID
 * @param {string} role - The role of the message sender ('user' or 'assistant')
 * @param {string} message - The message content
 * @param {string} persona - The persona (e.g., 'adina' or 'rafa')
 */
function addToConversationMemory(sessionId, role, message, persona) {
  if (!sessionId) return;

  // Create a unique key for this user-persona combination
  const key = `${sessionId}:${persona}`;

  // Get existing conversation or initialize new one
  const conversation = conversationMemory.get(key) || [];

  // Add new message
  conversation.push({
    role,
    content: message,
    timestamp: new Date().toISOString()
  });

  // Keep only the last 5 messages (to avoid memory bloat)
  const recentConversation = conversation.slice(-5);

  // Update memory
  conversationMemory.set(key, recentConversation);
}

/**
 * Gets conversation history for a user session
 * @param {string} sessionId - The user's session ID
 * @param {string} persona - The persona (e.g., 'adina' or 'rafa')
 * @returns {Array} - Array of conversation messages
 */
function getConversationMemory(sessionId, persona) {
  if (!sessionId) return [];

  // Create a unique key for this user-persona combination
  const key = `${sessionId}:${persona}`;

  // Return conversation or empty array if none exists
  return conversationMemory.get(key) || [];
}

/**
 * Formats conversation history as a context string
 * @param {Array} conversation - The conversation history
 * @returns {string} - Formatted conversation context
 */
function formatConversationContext(conversation) {
  if (!conversation || conversation.length === 0) return '';

  let context = '\n\nRecent conversation history:';

  conversation.forEach(message => {
    const role = message.role === 'user' ? 'User' : 'You';
    context += `\n${role}: ${message.content}`;
  });

  return context;
}

/**
 * Simple sentiment analysis function to detect basic emotions in text
 * @param {string} text - The text to analyze
 * @returns {Object} - Detected emotions and their confidence
 */
function detectEmotion(text) {
  if (!text) return { primaryEmotion: 'neutral', confidence: 1.0 };

  // Convert text to lowercase for case-insensitive matching
  const lowercaseText = text.toLowerCase();

  // Define emotion keywords with some common indicators
  // This is a very simple implementation - in production, use a proper NLP system
  const emotionKeywords = {
    anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'stress', 'anxiety', 'panic', 'fear', 'help me'],
    sad: ['sad', 'depressed', 'unhappy', 'miserable', 'grief', 'hurt', 'pain', 'crying', 'tears', 'heartbroken'],
    angry: ['angry', 'mad', 'furious', 'upset', 'annoyed', 'frustrated', 'hate', 'rage', 'irritated'],
    joyful: ['happy', 'joy', 'excited', 'glad', 'thankful', 'grateful', 'blessed', 'pleased', 'delighted'],
    confused: ['confused', 'unsure', 'uncertain', 'don\'t understand', 'complicated', 'unclear', 'lost', 'puzzled'],
    hopeful: ['hope', 'looking forward', 'believe', 'faith', 'optimistic', 'positive', 'better future'],
    neutral: []
  };

  // Count occurrences of emotion keywords
  const emotionCounts = {};
  let totalMatches = 0;

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    emotionCounts[emotion] = 0;

    keywords.forEach(keyword => {
      // Count occurrences of each keyword
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (lowercaseText.match(regex) || []).length;

      if (matches > 0) {
        emotionCounts[emotion] += matches;
        totalMatches += matches;
      }
    });
  }

  // Determine primary emotion (if no matches, default to neutral)
  let primaryEmotion = 'neutral';
  let highestCount = 0;

  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > highestCount) {
      highestCount = count;
      primaryEmotion = emotion;
    }
  }

  // Calculate confidence (higher if more matches)
  const confidence = totalMatches > 0 ? highestCount / totalMatches : 1.0;

  return {
    primaryEmotion,
    confidence,
    allEmotions: emotionCounts
  };
}

/**
 * Adjusts persona prompt based on detected user emotion
 * @param {string} prompt - The original prompt
 * @param {Object} personaConfig - The persona configuration
 * @param {Object} emotion - The detected emotion
 * @returns {string} - The adjusted prompt
 */
function adjustPromptForEmotion(prompt, personaConfig, emotion) {
  if (!emotion || emotion.primaryEmotion === 'neutral' || emotion.confidence < 0.6) {
    return prompt; // No adjustment needed
  }

  let emotionGuidance = '';
  const persona = personaConfig.name;

  // Customize responses based on persona and detected emotion
  switch (emotion.primaryEmotion) {
    case 'anxious':
      if (persona.toLowerCase() === 'adina') {
        emotionGuidance = 'The user seems anxious or worried. Respond with extra warmth, gentleness, and reassurance. Offer calming spiritual wisdom.';
      } else {
        emotionGuidance = 'The user seems anxious or worried. Provide clear, grounded direction. Be steady and confident to anchor them.';
      }
      break;

    case 'sad':
      if (persona.toLowerCase() === 'adina') {
        emotionGuidance = 'The user seems sad or in emotional pain. Respond with compassion and tenderness. Validate their feelings and offer hope.';
      } else {
        emotionGuidance = 'The user seems sad or in emotional pain. Offer firm but compassionate guidance. Provide perspective and actionable steps forward.';
      }
      break;

    case 'angry':
      if (persona.toLowerCase() === 'adina') {
        emotionGuidance = 'The user seems frustrated or angry. Respond with patience and calm. Help them process their feelings with wisdom.';
      } else {
        emotionGuidance = 'The user seems frustrated or angry. Acknowledge their feelings directly. Cut through the emotion to address the core issue.';
      }
      break;

    case 'confused':
      if (persona.toLowerCase() === 'adina') {
        emotionGuidance = 'The user seems confused or uncertain. Offer gentle clarity and simplify your explanations. Use metaphors to illustrate your point.';
      } else {
        emotionGuidance = 'The user seems confused or uncertain. Provide direct, structured guidance. Break down complex ideas into clear, actionable steps.';
      }
      break;

    case 'joyful':
      if (persona.toLowerCase() === 'adina') {
        emotionGuidance = 'The user seems happy or joyful. Share in their positive emotion while deepening their spiritual appreciation.';
      } else {
        emotionGuidance = 'The user seems happy or joyful. Build on this positive energy to encourage spiritual growth and bold action.';
      }
      break;

    case 'hopeful':
      if (persona.toLowerCase() === 'adina') {
        emotionGuidance = 'The user seems hopeful. Nurture this hope with gentle encouragement and spiritual insight.';
      } else {
        emotionGuidance = 'The user seems hopeful. Channel this hope into conviction and practical steps for spiritual growth.';
      }
      break;
  }

  // Add emotion guidance to the prompt if available
  if (emotionGuidance) {
    return `${prompt}\n\nEmotional context: ${emotionGuidance}`;
  }

  return prompt;
}

/**
 * Injects a persona-specific prompt into the user's message
 * @param {string} message - The user's original message
 * @param {Object} personaConfig - Configuration for the specific persona
 * @param {string} sessionId - The user's session ID (optional)
 * @returns {string} - The message with injected persona prompt
 */
function injectPersonaPrompt(message, personaConfig, sessionId = null) {
  if (!message || !personaConfig) {
    console.warn('Missing message or persona configuration');
    return message || '';
  }

  try {
    const { systemPrompt, contextPrompt, tone, style, name } = personaConfig;
    const persona = (name || '').toLowerCase();

    // Create a formatted prompt with the persona's system prompt and context
    let formattedPrompt = systemPrompt || '';

    // Add tone and style guidance if available
    if (tone || style) {
      formattedPrompt += `\n\nTone: ${tone || 'Not specified'}`;
      formattedPrompt += `\nStyle: ${style || 'Not specified'}`;
    }

    // Add context prompt if available
    if (contextPrompt) {
      formattedPrompt += `\n\n${contextPrompt}`;
    }

    // Add conversation history if session ID is provided
    if (sessionId) {
      const conversationHistory = getConversationMemory(sessionId, persona);
      formattedPrompt += formatConversationContext(conversationHistory);
    }

    // Detect emotion in the user's message
    const detectedEmotion = detectEmotion(message);

    // Add the user message
    formattedPrompt += `\n\nUser message: ${message}`;

    // Adjust prompt based on detected emotion
    formattedPrompt = adjustPromptForEmotion(formattedPrompt, personaConfig, detectedEmotion);

    // Store this message in memory if session ID is provided
    if (sessionId) {
      addToConversationMemory(sessionId, 'user', message, persona);
    }

    return formattedPrompt.trim();
  } catch (error) {
    console.error('Error injecting persona prompt:', error);
    // Return original message if there's an error
    return message;
  }
}

/**
 * Extracts the persona's response from the LLM output
 * @param {string} llmResponse - The raw response from the LLM
 * @param {Object} personaConfig - Configuration for the specific persona
 * @param {string} sessionId - The user's session ID (optional)
 * @returns {string} - The cleaned response
 */
function extractPersonaResponse(llmResponse, personaConfig, sessionId = null) {
  if (!llmResponse) return '';

  try {
    // Remove any system instructions or formatting that might be in the response
    // This is a simple implementation - might need to be more sophisticated based on your LLM
    let cleanedResponse = llmResponse;

    // Remove any prefixes like "Persona:" or "Assistant:"
    const prefixesToRemove = personaConfig.responsePrefixes || ['Persona:', 'Assistant:'];

    for (const prefix of prefixesToRemove) {
      if (cleanedResponse.startsWith(prefix)) {
        cleanedResponse = cleanedResponse.substring(prefix.length).trim();
      }
    }

    // Store assistant response in memory if session ID is provided
    if (sessionId && personaConfig.name) {
      const persona = personaConfig.name.toLowerCase();
      addToConversationMemory(sessionId, 'assistant', cleanedResponse, persona);
    }

    return cleanedResponse;
  } catch (error) {
    console.error('Error extracting persona response:', error);
    return llmResponse;
  }
}

module.exports = {
  injectPersonaPrompt,
  extractPersonaResponse,
  addToConversationMemory,
  getConversationMemory,
  detectEmotion,
  conversationMemory
}; 