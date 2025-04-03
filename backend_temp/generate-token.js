/**
 * Generate a LiveKit token for testing
 * This script generates a token that can be used for bypassing the backend
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");

// LiveKit credentials
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

// Token claims
const claims = {
  video: {
    roomJoin: true,
    room: "test-room",
    canPublish: true,
    canSubscribe: true,
  },
  iat: Math.floor(Date.now() / 1000),
  nbf: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
  iss: apiKey,
  sub: "test-user-1",
  jti: "test-user-1-" + Date.now(), // Unique identifier for this token
};

// Generate token
const token = jwt.sign(claims, apiSecret, { algorithm: "HS256" });

console.log("Generated LiveKit Token:");
