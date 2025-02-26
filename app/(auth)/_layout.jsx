import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Email-sign-in"
        options={{ 
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="Email-sign-up"
        options={{ 
          presentation: 'card'
        }} 
      />
    </Stack>
  );
} 