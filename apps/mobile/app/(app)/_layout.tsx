import React from 'react';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activity/[id]" />
      <Stack.Screen name="user/[userId]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="blocked" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="sponsor" />
    </Stack>
  );
}
