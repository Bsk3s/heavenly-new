import React from 'react';
import { Stack } from 'expo-router';

export default function StudyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index"
        options={{ 
          title: "Study Home"
        }} 
      />
      <Stack.Screen 
        name="notes" 
        options={{ 
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="editor" 
        options={{ 
          presentation: 'card'
        }} 
      />
    </Stack>
  );
} 