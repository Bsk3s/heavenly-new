import React from 'react';
import { StyledView, StyledText, StyledTouchableOpacity } from './StyledComponents';

const QuickReplies = ({ activeAI, quickReplies }) => {
  return (
    <StyledView 
      className="px-4 pb-4"
      accessible={true}
      accessibilityLabel="Quick reply suggestions"
      accessibilityRole="menu"
    >
      <StyledView className="flex-row flex-wrap justify-center">
        {quickReplies.map((reply, index) => (
          <StyledTouchableOpacity
            key={index}
            className={`px-3 py-2 m-1 rounded-full ${
              activeAI === 'adina'
                ? 'bg-pink-50' 
                : 'bg-blue-50'
            }`}
            accessible={true}
            accessibilityLabel={`Quick reply: ${reply}`}
            accessibilityRole="menuitem"
          >
            <StyledText className={
              activeAI === 'adina'
                ? 'text-pink-600 text-sm' 
                : 'text-blue-600 text-sm'
            }>
              {reply}
            </StyledText>
          </StyledTouchableOpacity>
        ))}
      </StyledView>
    </StyledView>
  );
};

export default QuickReplies; 