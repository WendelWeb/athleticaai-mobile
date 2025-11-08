/**
 * Layout for nested program screens
 */

import { Stack } from 'expo-router';

export default function ProgramLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="adaptive-scheduling" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="remix" />
    </Stack>
  );
}
