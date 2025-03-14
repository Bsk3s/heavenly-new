import React from 'react';
import { StyledView, StyledText, StyledTouchableOpacity } from './StyledComponents';

const AIToggle = ({ activeAI, setActiveAI }) => {
  return (
    <StyledView 
      className="flex-row items-center bg-gray-100 rounded-full p-1 w-48"
      accessible={true}
      accessibilityRole="radiogroup"
      accessibilityLabel="Select AI assistant"
    >
      <StyledTouchableOpacity
        onPress={() => setActiveAI('adina')}
        className={`flex-1 py-1.5 px-3 rounded-full ${
          activeAI === 'adina' 
            ? 'bg-white shadow' 
            : ''
        }`}
        accessible={true}
        accessibilityLabel="Adina assistant"
        accessibilityRole="radio"
        accessibilityState={{ checked: activeAI === 'adina' }}
      >
        <StyledText className={`text-sm font-medium text-center ${
          activeAI === 'adina' 
            ? 'text-pink-500' 
            : 'text-gray-500'
        }`}>
          Adina
        </StyledText>
      </StyledTouchableOpacity>
      <StyledTouchableOpacity
        onPress={() => setActiveAI('rafa')}
        className={`flex-1 py-1.5 px-3 rounded-full ${
          activeAI === 'rafa' 
            ? 'bg-white shadow' 
            : ''
        }`}
        accessible={true}
        accessibilityLabel="Rafa assistant"
        accessibilityRole="radio"
        accessibilityState={{ checked: activeAI === 'rafa' }}
      >
        <StyledText className={`text-sm font-medium text-center ${
          activeAI === 'rafa' 
            ? 'text-blue-500' 
            : 'text-gray-500'
        }`}>
          Rafa
        </StyledText>
      </StyledTouchableOpacity>
    </StyledView>
  );
};

export default AIToggle; 