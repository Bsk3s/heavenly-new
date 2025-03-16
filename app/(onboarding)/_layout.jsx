import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="denomination"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="age"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="bible-version"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Spiritual-journey"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Faith-challenges"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="growth"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="prayer-habits"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="satsifaction"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="shift"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="final"
        options={{
          headerShown: false
        }}
      />
      
    </Stack>
  );
}
