import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the API URL from app.json via expo-constants
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4001';

// Include options to handle self-signed certificates for development
const FETCH_OPTIONS = {
  // For development environments, we need to accept self-signed certificates
  ...(Platform.OS === 'android' && { 
    rejectUnauthorized: false,
  }),
};

/**
 * Handles errors from fetch responses
 * @param {Response} response - The fetch response object
 * @param {string} context - Description of the API call for error reporting
 * @returns {Promise<Response>} - The response if OK, otherwise throws an error
 */
const handleApiError = async (response, context) => {
  if (!response.ok) {
    let errorMessage = `Failed to ${context}`;
    let errorData = {};
    
    try {
      errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // If the response cannot be parsed as JSON
      errorMessage = `${errorMessage} (Status: ${response.status})`;
    }
    
    console.error(`API Error (${context}):`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
      message: errorMessage
    });
    
    throw new Error(errorMessage);
  }
  return response;
};

/**
 * Makes a GET request to the API
 * @param {string} endpoint - The API endpoint (without leading slash)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - The parsed JSON response
 */
export const get = async (endpoint, options = {}) => {
  try {
    console.log(`API GET: ${endpoint}`);
    const url = `${API_URL}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...FETCH_OPTIONS,
      ...options
    });
    
    await handleApiError(response, `get ${endpoint}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in API GET ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Makes a POST request to the API
 * @param {string} endpoint - The API endpoint (without leading slash)
 * @param {Object} body - The request body to send as JSON
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - The parsed JSON response
 */
export const post = async (endpoint, body = {}, options = {}) => {
  try {
    console.log(`API POST: ${endpoint}`);
    const url = `${API_URL}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body),
      ...FETCH_OPTIONS,
      ...options
    });
    
    await handleApiError(response, `post to ${endpoint}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in API POST ${endpoint}:`, error);
    throw error;
  }
};

// Export as named functions and as default object
export default {
  get,
  post,
  API_URL
}; 