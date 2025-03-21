import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StyledView } from './StyledComponents';
import { useLiveKit } from '../livekit/LiveKitProvider';

const VoiceControls = ({ 
  isListening, 
  setIsListening, 
  activeAI, 
  showQuickReplies, 
  setShowQuickReplies 
}) => {
  const { 
    connect, 
    disconnect, 
    toggleAudio, 
    isConnected,
    isConnecting,
    audioEnabled,
    error
  } = useLiveKit();

  // Effect to sync the LiveKit state with the UI
  useEffect(() => {
    // If audio is enabled, we are listening
    setIsListening(audioEnabled);
  }, [audioEnabled, setIsListening]);

  // Handle press on microphone button
  const handleMicPress = async () => {
    try {
      if (!isConnected) {
        // Connect to LiveKit if not connected
        const success = await connect(activeAI);
        if (success) {
          // Enable microphone after successful connection
          setTimeout(() => {
            toggleAudio();
          }, 500);
        }
      } else {
        // Toggle microphone if already connected
        await toggleAudio();
      }
    } catch (err) {
      console.error('Error handling mic press:', err);
    }
  };

  // Handle closing the chat session
  const handleClosePress = async () => {
    try {
      await disconnect();
      setIsListening(false);
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  // Handle toggling quick replies
  const handleChatToggle = () => {
    setShowQuickReplies(!showQuickReplies);
  };

  return (
    <StyledView className="flex-row justify-around items-center py-4 px-6 border-t border-gray-100">
      {/* Close button */}
      <TouchableOpacity
        onPress={handleClosePress}
        style={styles.controlButton}
        accessible={true}
        accessibilityLabel="Close voice chat"
        accessibilityRole="button"
        accessibilityHint="Ends the current voice conversation"
      >
        <Feather name="x" size={24} color="#6B7280" />
      </TouchableOpacity>
      
      {/* Microphone button */}
      <TouchableOpacity
        onPress={handleMicPress}
        style={[
          styles.micButton,
          isListening ? styles.activeMic : null,
          isConnecting ? styles.connectingMic : null
        ]}
        accessible={true}
        accessibilityLabel={isListening ? "Stop talking" : "Start talking"}
        accessibilityRole="button"
        accessibilityHint="Toggles the microphone on or off"
        disabled={isConnecting}
      >
        <Feather 
          name={isListening ? "mic" : "mic-off"} 
          size={28} 
          color={isListening ? "#FFFFFF" : "#EC4899"} 
        />
      </TouchableOpacity>
      
      {/* Chat toggle button */}
      <TouchableOpacity
        onPress={handleChatToggle}
        style={styles.controlButton}
        accessible={true}
        accessibilityLabel={showQuickReplies ? "Hide suggestions" : "Show suggestions"}
        accessibilityRole="button"
        accessibilityHint="Toggles the visibility of quick reply suggestions"
      >
        <Feather name="message-circle" size={24} color="#6B7280" />
      </TouchableOpacity>
    </StyledView>
  );
};

const styles = StyleSheet.create({
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EC4899',
    shadowColor: '#EC4899',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  activeMic: {
    backgroundColor: '#EC4899',
    borderColor: '#FFFFFF',
  },
  connectingMic: {
    opacity: 0.7,
    backgroundColor: '#F3F4F6',
  }
});

export default VoiceControls; 