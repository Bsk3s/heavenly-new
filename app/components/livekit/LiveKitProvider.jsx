import React, { createContext, useState, useContext, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { ConnectionState, Room, RoomEvent } from 'livekit-client';
import Constants from 'expo-constants';

// Create LiveKit context
const LiveKitContext = createContext(null);

export const useLiveKit = () => useContext(LiveKitContext);

// Get API base URL from environment variables, fallback to development URL if not set
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export default function LiveKitProvider({ children }) {
  const [room, setRoom] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [participantIdentity, setParticipantIdentity] = useState(''); 
  const [error, setError] = useState(null);
  const [activeAgent, setActiveAgent] = useState('adina');

  // Initialize room when component mounts
  useEffect(() => {
    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    // Set up room event listeners
    newRoom
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log('Connection state changed:', state);
        setIsConnected(state === ConnectionState.Connected);
        setIsConnecting(state === ConnectionState.Connecting);
        
        if (state === ConnectionState.Disconnected) {
          console.log('Disconnected from room');
        }
      })
      .on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
      })
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, 'from', participant.identity);
      })
      .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      })
      .on(RoomEvent.MediaDevicesError, (e) => {
        console.error('Media Device Error:', e);
        setError('Media device error: ' + e.message);
      });

    setRoom(newRoom);

    return () => {
      try {
        newRoom.disconnect();
      } catch (e) {
        console.error('Error disconnecting from room:', e);
      }
    };
  }, []);

  // Connect to a LiveKit room
  const connect = async (persona = 'adina', userName = 'User') => {
    if (!room) {
      setError('Room not initialized');
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setActiveAgent(persona);

      // Set a random user name if not provided
      const userIdentity = userName || `user_${Math.floor(Math.random() * 10000)}`;
      setParticipantIdentity(userIdentity);

      // Create a room name based on the persona
      const newRoomName = `voice-${persona}-${Date.now()}`;
      setRoomName(newRoomName);

      console.log(`Connecting to ${newRoomName} as ${userIdentity}`);

      // Start a session on the backend
      const sessionResponse = await fetch(`${API_BASE_URL}/api/voice/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to start voice session');
      }

      const sessionData = await sessionResponse.json();
      const actualRoomName = sessionData.roomName;
      setRoomName(actualRoomName);

      // Get a token for the room
      const tokenResponse = await fetch(`${API_BASE_URL}/api/voice/token?roomName=${actualRoomName}&participantName=${userIdentity}`);
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const tokenData = await tokenResponse.json();
      const { token, url } = tokenData;

      // Connect to the room
      await room.connect(url, token);
      console.log('Connected to room:', actualRoomName);
      setIsConnecting(false);
      
      return true;
    } catch (e) {
      console.error('Error connecting to room:', e);
      setError(e.message);
      setIsConnecting(false);
      Alert.alert('Connection Error', `Could not connect to voice room: ${e.message}`);
      return false;
    }
  };

  // Disconnect from the current room
  const disconnect = async () => {
    try {
      if (isConnected && room) {
        await room.disconnect();
        
        // End the session on the backend
        if (roomName) {
          await fetch(`${API_BASE_URL}/api/voice/end`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              roomName,
            }),
          });
        }
        
        setRoomName('');
        setAudioEnabled(false);
      }
    } catch (e) {
      console.error('Error disconnecting from room:', e);
      setError(e.message);
    }
  };

  // Toggle local microphone
  const toggleAudio = async () => {
    try {
      if (!isConnected) {
        setError('Not connected to a room');
        return false;
      }

      if (audioEnabled) {
        // Disable microphone
        room.localParticipant.setMicrophoneEnabled(false);
        setAudioEnabled(false);
      } else {
        // Enable microphone
        await room.localParticipant.setMicrophoneEnabled(true);
        setAudioEnabled(true);
      }
      
      return true;
    } catch (e) {
      console.error('Error toggling audio:', e);
      setError(e.message);
      return false;
    }
  };

  const value = {
    room,
    roomName,
    isConnected,
    isConnecting,
    error,
    participantIdentity,
    audioEnabled,
    activeAgent,
    connect,
    disconnect,
    toggleAudio,
    setActiveAgent
  };

  return (
    <LiveKitContext.Provider value={value}>
      {children}
    </LiveKitContext.Provider>
  );
} 