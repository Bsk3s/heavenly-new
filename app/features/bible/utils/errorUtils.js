// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUDIO: 'AUDIO',
  TTS: 'TTS',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN',
  OFFLINE: 'OFFLINE',
  INTERRUPTED: 'INTERRUPTED'
};

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: 'Having Trouble Connecting',
    message: 'It looks like your internet connection is a bit weak right now.',
    action: 'Try Again'
  },
  [ERROR_TYPES.AUDIO]: {
    title: 'Playback Paused',
    message: 'Something interrupted the audio. Don\'t worry, this happens sometimes.',
    action: 'Resume'
  },
  [ERROR_TYPES.TTS]: {
    title: 'Voice Generation Paused',
    message: 'We\'re having trouble creating the voice for this verse right now.',
    action: 'Try Again'
  },
  [ERROR_TYPES.PERMISSION]: {
    title: 'Need Your Permission',
    message: 'To play the audio Bible, we need permission to use your device\'s sound.',
    action: 'Allow Audio'
  },
  [ERROR_TYPES.OFFLINE]: {
    title: 'You\'re Offline',
    message: 'Please connect to the internet to listen to Bible verses.',
    action: 'Try Again'
  },
  [ERROR_TYPES.INTERRUPTED]: {
    title: 'Audio Interrupted',
    message: 'Looks like another app needed the audio. You can resume whenever you\'re ready.',
    action: 'Resume'
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Oops!',
    message: 'Something unexpected happened while playing the audio.',
    action: 'Try Again'
  }
};

// Helper function to categorize errors
export function categorizeError(error) {
  if (!error) return null;

  // Network errors
  if (
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('internet') ||
    error.message?.toLowerCase().includes('fetch') ||
    error.name === 'NetworkError'
  ) {
    return navigator.onLine ? ERROR_TYPES.NETWORK : ERROR_TYPES.OFFLINE;
  }

  // Audio interruption
  if (
    error.message?.toLowerCase().includes('interrupted') ||
    error.message?.toLowerCase().includes('interruption') ||
    error.message?.toLowerCase().includes('audio session')
  ) {
    return ERROR_TYPES.INTERRUPTED;
  }

  // Audio errors
  if (
    error.message?.toLowerCase().includes('audio') ||
    error.message?.toLowerCase().includes('playback') ||
    error.message?.toLowerCase().includes('sound') ||
    error.message?.toLowerCase().includes('player')
  ) {
    return ERROR_TYPES.AUDIO;
  }

  // TTS errors
  if (
    error.message?.toLowerCase().includes('tts') ||
    error.message?.toLowerCase().includes('speech') ||
    error.message?.toLowerCase().includes('synthesize')
  ) {
    return ERROR_TYPES.TTS;
  }

  // Permission errors
  if (
    error.message?.toLowerCase().includes('permission') ||
    error.message?.toLowerCase().includes('denied') ||
    error.message?.toLowerCase().includes('access')
  ) {
    return ERROR_TYPES.PERMISSION;
  }

  return ERROR_TYPES.UNKNOWN;
}

// Main error handler function
export function handleError(error) {
  const errorType = categorizeError(error);
  const errorInfo = ERROR_MESSAGES[errorType];

  return {
    type: errorType,
    ...errorInfo,
    originalError: error
  };
}

// Function to get retry action based on error type
export function getRetryAction(errorType) {
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 'Check your internet connection and tap "Try Again" when you\'re ready.';
    case ERROR_TYPES.OFFLINE:
      return 'Connect to the internet and tap "Try Again" to continue listening.';
    case ERROR_TYPES.AUDIO:
      return 'Tap "Resume" to continue listening where you left off.';
    case ERROR_TYPES.TTS:
      return 'Give it another try. If the problem continues, you might want to restart the app.';
    case ERROR_TYPES.PERMISSION:
      return 'Tap "Allow Audio" to open your settings and enable audio permissions.';
    case ERROR_TYPES.INTERRUPTED:
      return 'When you\'re done with other audio, tap "Resume" to continue listening.';
    default:
      return 'Tap "Try Again" to continue listening. If the problem continues, try restarting the app.';
  }
}

const errorUtils = {
  ERROR_TYPES,
  ERROR_MESSAGES,
  categorizeError,
  handleError,
  getRetryAction
};

export default errorUtils; 