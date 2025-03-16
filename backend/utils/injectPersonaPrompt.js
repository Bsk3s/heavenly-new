/**
 * injectPersonaPrompt.js
 * Utility to inject persona-specific prompts into user messages
 */

/**
 * Injects a persona-specific prompt into the user's message
 * @param {string} message - The user's original message
 * @param {Object} personaConfig - Configuration for the specific persona
 * @returns {string} - The message with injected persona prompt
 */
function injectPersonaPrompt(message, personaConfig) {
  if (!message || !personaConfig) {
    console.warn('Missing message or persona configuration');
    return message || '';
  }

  try {
    const { systemPrompt, contextPrompt, tone, style } = personaConfig;
    
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
    
    // Add the user message
    formattedPrompt += `\n\nUser message: ${message}`;

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
 * @returns {string} - The cleaned response
 */
function extractPersonaResponse(llmResponse, personaConfig) {
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
    
    return cleanedResponse;
  } catch (error) {
    console.error('Error extracting persona response:', error);
    return llmResponse;
  }
}

module.exports = {
  injectPersonaPrompt,
  extractPersonaResponse
}; 