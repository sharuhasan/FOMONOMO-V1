import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-6xl mb-4">404</Text>
      <Text className="text-xl font-body-bold text-foreground mb-2">Page Not Found</Text>
      <Text className="text-muted-foreground text-center mb-8">
        The page you're looking for doesn't exist.
      </Text>
      <Pressable
        onPress={() => router.replace('/(app)/(discover)')}
        className="bg-primary px-6 py-3 rounded-full"
      >
        <Text className="text-primary-foreground font-body-bold">Go Home</Text>
      </Pressable>
    </View>
  );
}
