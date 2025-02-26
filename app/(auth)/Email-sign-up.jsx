import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import BackButton from '../components/back-button';

export default function EmailSignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleBack = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top header with back button and title */}
      <View className="px-4 pt-2 flex-row items-center">
        <BackButton onPress={handleBack} />
        <Text className="flex-1 text-2xl font-bold text-center mr-10">
          Sign up
        </Text>
      </View>

      <View className="flex-1 px-6 mt-20">
        {/* Logo Space */}
        <View className="h-32 mt-8 mb-12 justify-center items-center">
          <Image 
            source={require('../../assets/images/HBMAIN1.png')} 
            style={{ width: 300, height: 300 }}
            resizeMode="contain"
            fadeDuration={0}
            quality={1}
          />
        </View>

        {/* Main Heading */}
        <Text className="text-3xl font-bold mb-8">
          Let's get your account set up
        </Text>

        {/* Form Fields */}
        <View className="mt-2">
          <View className="bg-white border border-neutral-400 rounded-3xl px-4 py-3 mb-3">
            <Text className="text-gray-500 text-sm">Email</Text>
            <TextInput
              className="text-base"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="bg-white border border-neutral-400 rounded-3xl px-4 py-3 mb-3">
            <Text className="text-gray-500 text-sm">Password</Text>
            <TextInput
              className="text-base"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="bg-white border border-neutral-400 rounded-3xl px-4 py-3">
            <Text className="text-gray-500 text-sm">Confirm password</Text>
            <TextInput
              className="text-base"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Terms and Privacy - moved down */}
        <Text className="text-center text-gray-600 mt-8">
          By creating an account using email, I agree to the{' '}
          <Text className="text-purple-600">Terms and Conditions</Text>
          {', '}and acknowledge the{' '}
          <Text className="text-purple-600">Privacy Policy</Text>
        </Text>

        {/* Create Account Button - moved down */}
        <TouchableOpacity 
          className="bg-black rounded-full py-4 mt-8"
          activeOpacity={0.8}
        >
          <Text className="text-white text-center font-semibold">
            Create account
          </Text>
        </TouchableOpacity>

        {/* Sign In Link - moved down */}
        <TouchableOpacity 
          className="mt-4 bg-gray-100 rounded-full py-4"
          activeOpacity={0.8}
          onPress={() => router.push('/(auth)/Email-sign-in')}
        >
          <Text className="text-center font-semibold">
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}