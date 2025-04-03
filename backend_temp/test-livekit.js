const express = require('express');
const { AccessToken } = require('livekit-server-sdk');

const app = express();

app.get('/test', (req, res) => {
  try {
    console.log('Testing LiveKit...');
    const token = new AccessToken('devkey', 'secret', { identity: 'test' });
    token.addGrant({ room: 'test', roomJoin: true });
    token.toJwt();
    
    res.json({ success: true, message: 'LiveKit is working' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(4000, () => console.log('Test server running on port 4000')); 