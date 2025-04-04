/**
 * test-livekit-local.js
 * A standalone script to test LiveKit configuration without needing to deploy to Render
 * 
 * Usage: 
 * 1. Make sure your .env file has the correct LiveKit credentials
 * 2. Run with: node test-livekit-local.js
 */

require('dotenv').config();
const { AccessToken } = require('livekit-server-sdk');

// Function to test LiveKit configuration
async function testLiveKitConfig() {
  console.log('Testing LiveKit configuration...');
  
  // Check environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  console.log('\n=== LIVEKIT CONFIGURATION ===');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : 'not set');
  console.log('API Secret:', apiSecret ? `${apiSecret.substring(0, 3)}...` : 'not set');
  console.log('WebSocket URL:', wsUrl || 'not set');
  
  // Validation
  const issues = [];
  if (!apiKey) issues.push('Missing LIVEKIT_API_KEY');
  if (!apiSecret) issues.push('Missing LIVEKIT_API_SECRET');
  if (!wsUrl) issues.push('Missing LIVEKIT_WS_URL');
  
  if (!apiKey || !apiSecret || !wsUrl) {
    console.error('\n❌ LiveKit configuration incomplete:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    return false;
  }
  
  // Format validation
  if (!wsUrl.startsWith('wss://')) {
    console.error('\n❌ WebSocket URL must start with wss://');
    return false;
  }
  
  // Try to create an access token
  try {
    console.log('\nAttempting to create an access token...');
    
    const at = new AccessToken(apiKey, apiSecret, {
      identity: 'test-user',
      name: 'Test User',
      ttl: 60 * 60 // 1 hour in seconds
    });

    // Add permissions
    at.addGrant({
      room: 'test-room',
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = at.toJwt();
    console.log('✅ Successfully created test token!');
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    
    // Parse the token to show payload
    const tokenParts = token.split('.');
    if (tokenParts.length >= 2) {
      try {
        // Base64 decode
        const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        console.log('\nToken payload:', JSON.stringify(payload, null, 2));
      } catch (e) {
        console.warn('Could not parse token payload:', e.message);
      }
    }
    
    console.log('\n✅ LiveKit configuration test PASSED');
    console.log('You should now be able to use this configuration with your app.');
    return true;
  } catch (tokenError) {
    console.error('\n❌ Failed to create test token:', tokenError.message);
    console.error('Error details:', tokenError);
    return false;
  }
}

// Run the test
testLiveKitConfig()
  .then(success => {
    if (success) {
      console.log('\n✅ LiveKit test completed successfully');
    } else {
      console.error('\n❌ LiveKit test failed');
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error during LiveKit test:', error);
  }); 