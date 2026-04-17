import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SponsorScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-6xl mb-4">📊</Text>
        <Text className="text-xl font-body-bold text-foreground">Sponsor Dashboard</Text>
        <Text className="text-muted-foreground mt-2">Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
