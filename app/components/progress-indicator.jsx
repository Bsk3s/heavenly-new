import React from 'react';
import { View } from 'react-native';
import BackButton from './back-button';

export const STEP_COLORS = {
  1: '#FF0080', // Neon pink
  2: '#7928CA', // Electric purple
  3: '#0070F3', // Bright blue
  4: '#00DFD8', // Turquoise
  5: '#FF4D4D', // Coral red
  6: '#F7B955', // Golden yellow
  7: '#50E3C2', // Mint
  8: '#FF0080', // Back to pink
  9: '#7928CA', // Electric purple
  10: '#0070F3', // Bright blue
};

// Total steps in our flow:
// 1. denomination
// 2. age
// 3. bible-version
// 4. Spiritual-journey
// 5. Faith-challenges
// 6. growth
// 7. prayer-habits
// 8. satsifaction
// 9. shift
// 10. final

const ProgressHeader = ({ currentStep, totalSteps = 10, onBack }) => {
  return (
    <View className="w-full px-4 py-2">
      <View className="flex-row items-center justify-between mb-2">
        <BackButton onPress={onBack} />
        <View className="flex-1 mx-2 h-2.5 bg-gray-200 rounded">
          <View
            className="h-full rounded"
            style={{ 
              width: `${(currentStep / totalSteps) * 100}%`,
              backgroundColor: STEP_COLORS[currentStep]
            }}
          />
        </View>
        <View className="w-4" />
      </View>
    </View>
  );
};

export default ProgressHeader;