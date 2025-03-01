import React from 'react';
import { Text } from 'react-native';

/**
 * A consistent verse number component to be used across the app
 * @param {Object} props
 * @param {string|number} props.number - The verse number to display
 * @param {string} [props.className] - Additional className to apply
 * @param {boolean} [props.isInline] - Whether this is an inline verse number
 */
const VerseNumber = ({ number, className = '', isInline = false }) => {
  // Convert number to string if it isn't already
  const numberStr = String(number);
  
  return (
    <Text 
      className={`text-gray-400 ${className}`}
      style={{ 
        fontSize: isInline ? 14 : 11,
        lineHeight: isInline ? 28 : 16,
        marginTop: isInline ? 0 : 4,
        marginRight: isInline ? 2 : 4,
        marginLeft: isInline ? 4 : 0,
        // Single digit numbers (1-9) are bold
        fontWeight: numberStr.length === 1 ? '600' : '400',
        fontFamily: 'System'
      }}
    >
      {isInline ? ` ${number}` : number}
    </Text>
  );
};

export default VerseNumber; 