import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyledView, StyledText, StyledTouchableOpacity, StyledSafeAreaView } from '../components/chat/StyledComponents';
import AIToggle from '../components/chat/AIToggle';
import VoiceVisualization from '../components/chat/VoiceVisualization';
import QuickReplies from '../components/chat/QuickReplies';
import VoiceControls from '../components/chat/VoiceControls';
import useVoiceAnimation from '../components/chat/useVoiceAnimation';

const Chat = () => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [activeAI, setActiveAI] = useState('adina'); // 'adina' or 'rafa'
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  
  // Quick reply suggestions
  const quickReplies = [
    "Tell me more",
    "Give me a verse",
    "How does this apply to me?",
    "Explain further"
  ];

  // Get animation values from custom hook
  const {
    blobScale,
    glowOpacity,
    particles,
    particleOpacity,
    particleScale
  } = useVoiceAnimation(isListening);

  // Handle navigation to Bible tab while preserving voice state
  const handleBibleNavigation = () => {
    // Navigate to Bible tab
    router.push('/bible');
    
    // We don't need to stop listening here as the voice state
    // should persist across tabs if that's the desired behavior
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-white">
      {/* Header with AI Toggle */}
      <StyledView className="px-4 pt-8 pb-2">
        <StyledView className="flex-row justify-end items-center mb-3">
          <StyledTouchableOpacity
            onPress={handleBibleNavigation}
            accessible={true}
            accessibilityLabel="Open Bible"
            accessibilityRole="button"
            accessibilityHint="Navigates to the Bible tab"
          >
            <Feather name="book-open" size={20} color="#4b5563" />
          </StyledTouchableOpacity>
        </StyledView>
        
        {/* AI Toggle Switch */}
        <StyledView className="flex-row justify-center my-2">
          <AIToggle activeAI={activeAI} setActiveAI={setActiveAI} />
        </StyledView>
      </StyledView>

      {/* Main Content - Voice Interaction Area */}
      <VoiceVisualization 
        activeAI={activeAI}
        isListening={isListening}
        blobScale={blobScale}
        glowOpacity={glowOpacity}
        particles={particles}
        particleOpacity={particleOpacity}
        particleScale={particleScale}
      />

      {/* Quick Reply Suggestions */}
      {showQuickReplies && (
        <QuickReplies activeAI={activeAI} quickReplies={quickReplies} />
      )}

      {/* Voice Controls */}
      <VoiceControls 
        isListening={isListening}
        setIsListening={setIsListening}
        activeAI={activeAI}
        showQuickReplies={showQuickReplies}
        setShowQuickReplies={setShowQuickReplies}
      />
    </StyledSafeAreaView>
  );
};

export default Chat;
