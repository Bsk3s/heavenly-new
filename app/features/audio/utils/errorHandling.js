/**
 * Handle TTS API errors with user-friendly messages
 */
export const handleTTSError = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        return 'Authentication Error: Please check your Google API key.';
      case 403:
        return 'Authorization Error: Your API key may not have the necessary permissions.';
      case 429:
        return 'Rate Limit Error: Too many requests. Please try again later.';
      default:
        return `API Error: Google TTS service returned ${error.response.status}`;
    }
  } else if (error.request) {
    return 'Network Error: Could not connect to Google TTS service. Please check your internet connection.';
  }
  return 'An unexpected error occurred while processing the text-to-speech request.';
};

/**
 * Handle audio playback errors
 */
export const handlePlaybackError = (error) => {
  if (error.message?.includes('interrupted')) {
    return 'Audio playback was interrupted. Please try again.';
  }
  if (error.message?.includes('loading')) {
    return 'Failed to load audio. Please try again.';
  }
  return 'An error occurred during audio playback. Please try again.';
};

/**
 * Format error for logging
 */
export const formatErrorForLogging = (error, context) => {
  return {
    context,
    message: error.message,
    code: error.code,
    response: error.response?.data,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
}; 