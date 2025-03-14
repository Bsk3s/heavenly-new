import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StyledView, StyledTouchableOpacity } from './StyledComponents';

const VoiceControls = ({ 
  isListening, 
  setIsListening, 
  activeAI, 
  showQuickReplies, 
  setShowQuickReplies 
}) => {
  return (
    <StyledView className="pb-8 flex-row justify-center items-center">
      <StyledTouchableOpacity 
        onPress={() => setIsListening(false)}
        className="p-3 mx-3 rounded-full bg-gray-50"
        accessible={true}
        accessibilityLabel="Cancel listening"
        accessibilityRole="button"
        accessibilityHint="Stops the voice recognition"
      >
        <Feather name="x" size={20} color="#6b7280" />
      </StyledTouchableOpacity>
      
      <StyledTouchableOpacity 
        onPress={() => setIsListening(!isListening)}
        className={`p-5 mx-3 rounded-full ${
          isListening 
            ? activeAI === 'adina'
              ? 'bg-pink-50 shadow-lg' 
              : 'bg-blue-50 shadow-lg'
            : 'bg-gray-50'
        }`}
        accessible={true}
        accessibilityLabel={isListening ? "Stop listening" : "Start listening"}
        accessibilityRole="button"
        accessibilityState={{ selected: isListening }}
        accessibilityHint={isListening ? "Stops voice recognition" : "Starts voice recognition"}
      >
        <Feather 
          name="mic" 
          size={24} 
          color={
            isListening 
              ? activeAI === 'adina'
                ? '#db2777' // pink-600
                : '#2563eb' // blue-600
              : "#6b7280"
          } 
        />
      </StyledTouchableOpacity>
      
      <StyledTouchableOpacity 
        onPress={() => setShowQuickReplies(!showQuickReplies)}
        className="p-3 mx-3 rounded-full bg-gray-50"
        accessible={true}
        accessibilityLabel={showQuickReplies ? "Hide quick replies" : "Show quick replies"}
        accessibilityRole="button"
        accessibilityState={{ expanded: showQuickReplies }}
      >
        <Feather name="message-circle" size={20} color="#6b7280" />
      </StyledTouchableOpacity>
    </StyledView>
  );
};

export default VoiceControls; 