import { View, Text, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';

// Style the components with NativeWind
export const StyledView = styled(View);
export const StyledText = styled(Text);
export const StyledTouchableOpacity = styled(TouchableOpacity);
export const StyledSafeAreaView = styled(SafeAreaView);
export const StyledAnimated = styled(Animated.View);

// Style the LinearGradient
export const StyledGradient = styled(LinearGradient);

// Default export for all styled components
export default {
  StyledView,
  StyledText,
  StyledTouchableOpacity,
  StyledSafeAreaView,
  StyledAnimated,
  StyledGradient
}; 