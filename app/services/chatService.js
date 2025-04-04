import { post, get } from './apiService';

/**
 * Send a message to the Adina AI character
 * @param {string} message - The message to send to the AI
 * @returns {Promise<Object>} The response from the AI
 */
export const sendMessageToAdina = async (message) => {
  try {
    return await post('api/chat/adina', { message });
  } catch (error) {
    console.error('Error sending message to Adina:', error);
    throw error;
  }
};

/**
 * Send a message to the Rafa AI character
 * @param {string} message - The message to send to the AI
 * @returns {Promise<Object>} The response from the AI
 */
export const sendMessageToRafa = async (message) => {
  try {
    return await post('api/chat/rafa', { message });
  } catch (error) {
    console.error('Error sending message to Rafa:', error);
    throw error;
  }
};

/**
 * Test the backend connection
 * @returns {Promise<Object>} The test response
 */
export const testConnection = async () => {
  try {
    return await get('api/test');
  } catch (error) {
    console.error('Error testing API connection:', error);
    throw error;
  }
};

/**
 * Test voice connection to LiveKit
 * @returns {Promise<Object>} The voice connection test response
 */
export const testVoiceConnection = async () => {
  try {
    return await get('api/voice/test-connection');
  } catch (error) {
    console.error('Error testing voice connection:', error);
    throw error;
  }
};

export default {
  sendMessageToAdina,
  sendMessageToRafa,
  testConnection,
  testVoiceConnection
}; 