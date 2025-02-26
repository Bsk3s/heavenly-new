import React, { useRef, useEffect } from 'react';
import { View, Animated, PanResponder, Text, Pressable, TouchableOpacity, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';

const AppleIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path d="M16.3,12.3c0-2.3,1.9-3.4,2-3.4c-1.1-1.6-2.8-1.8-3.4-1.8c-1.4-0.1-2.8,0.8-3.5,0.8 c-0.7,0-1.8-0.8-3-0.8c-1.5,0-2.9,0.9-3.7,2.3c-1.6,2.8-0.4,6.8,1.1,9c0.8,1.1,1.7,2.3,2.9,2.3c1.2,0,1.6-0.8,3-0.8 c1.4,0,1.8,0.8,3,0.8c1.2,0,2-1.1,2.8-2.2c0.9-1.3,1.2-2.5,1.2-2.6C18.7,16,16.3,15.3,16.3,12.3z M14.2,6.9 c0.6-0.8,1.1-1.9,0.9-3c-0.9,0-2,0.6-2.6,1.4c-0.6,0.7-1.1,1.8-0.9,2.9C12.6,8.3,13.6,7.7,14.2,6.9z" fill="black"/>
  </Svg>
);

const GoogleIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" fill="#4285F4"/>
    <Path d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 20.29 7.565 24 12.255 24z" fill="#34A853"/>
    <Path d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" fill="#FBBC05"/>
    <Path d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335"/>
  </Svg>
);

export default function SignInSlider({ isOpen, onClose }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(isOpen ? 0 : 1)).current;
  const router = useRouter();
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 0 : 1,
      useNativeDriver: true,
      tension: 20,
      friction: 8,
      overshootClamping: true
    }).start();
  }, [isOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newValue = gestureState.dy / 150;
        slideAnim.setValue(Math.max(0, Math.min(1, newValue)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 20,
            friction: 8
          }).start();
        }
      },
    })
  ).current;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/Email-sign-in');
  };

  const handleAppleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add Apple sign in logic here
    console.log('Apple sign in pressed');
  };

  const handleGoogleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add Google sign in logic here
    console.log('Google sign in pressed');
  };

  return (
    <View style={{ 
      position: 'absolute',
      bottom: -insets.bottom,
      left: 0,
      right: 0,
      display: isOpen ? 'flex' : 'none'
    }}>
      <Animated.View 
        className="bg-neutral-800 rounded-t-3xl"
        style={[
          { 
            transform: [{ translateY }],
            paddingBottom: insets.bottom,
            minHeight: 230,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Top drag handle */}
        <View className="items-center pt-3 pb-4">
          <View className="w-12 h-1 bg-white rounded-full" />
        </View>

        {/* Main content area */}
        <View className="px-6">
          {/* Apple Sign In */}
          <TouchableOpacity 
            onPress={handleAppleSignIn}
            className="h-14 bg-white rounded-full mb-3 flex-row items-center"
          >
            <View className="flex-1 flex-row items-center justify-center">
              <View className="mr-2">
                <AppleIcon />
              </View>
              <Text className="text-black font-semibold text-lg">
                Sign in with Apple
              </Text>
            </View>
          </TouchableOpacity>

          {/* Google Sign In */}
          <TouchableOpacity 
            onPress={handleGoogleSignIn}
            className="h-14 bg-white rounded-full mb-3 flex-row items-center"
          >
            <View className="flex-1 flex-row items-center justify-center">
              <View className="mr-2">
                <GoogleIcon />
              </View>
              <Text className="text-black font-semibold text-lg">
                Sign in with Google
              </Text>
            </View>
          </TouchableOpacity>

          {/* Email Sign In */}
          <TouchableOpacity 
            onPress={handleSignIn}
            className="h-14 bg-white rounded-full mb-6 flex-row items-center"
          >
            <View className="flex-1 flex-row items-center justify-center">
              <View className="mr-2">
                <Mail size={24} color="black" strokeWidth={2} />
              </View>
              <Text className="text-black font-semibold text-lg">
                Sign in with Email
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}