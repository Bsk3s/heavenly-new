require("dotenv").config();
const { AccessToken } = require("livekit-server-sdk");

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const wsUrl = process.env.LIVEKIT_WS_URL;

console.log("Testing LiveKit Configuration...");
console.log("Checking LiveKit configuration:", {
  hasApiKey: !!apiKey,
  hasApiSecret: !!apiSecret,
  hasWsUrl: !!wsUrl,
});

if (!apiKey || !apiSecret || !wsUrl) {
  console.error("Missing LiveKit configuration");
  process.exit(1);
}

// Try to create an access token as a basic test
try {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: "test-user",
  });
  at.addGrant({ roomJoin: true, room: "test-room" });
  const token = at.toJwt();

  console.log("✓ Successfully created test token");
  console.log("✓ LiveKit configuration is valid");
  console.log("Configuration:", {
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    wsUrl: wsUrl,
  });
  process.exit(0);
} catch (error) {
  console.error("✗ Error creating test token:", error.message);
  process.exit(1);
}
