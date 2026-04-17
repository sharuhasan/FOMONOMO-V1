import React from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useBlockedUsers, useUnblockUser } from '../../src/api/hooks';
import Avatar from '../../src/components/Avatar';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  const handleUnblock = (user: any) => {
    const name = user.profile?.displayName || user.fullName || 'this user';
    Alert.alert('Unblock User', `Unblock ${name}? They will be able to see your activities again.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => unblockUser.mutate(user.id),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <Text className="text-lg font-body-bold text-foreground flex-1">Blocked Users</Text>
        <Text className="text-muted-foreground text-sm">{blockedUsers?.length ?? 0}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : (
        <FlatList
          data={blockedUsers ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-5xl mb-4">🛡️</Text>
              <Text className="text-muted-foreground text-center">
                You haven't blocked anyone
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const name = item.profile?.displayName || item.fullName || 'User';
            return (
              <View className="flex-row items-center bg-card border border-border rounded-xl p-3 mb-2">
                <View className="mr-3">
                  <Avatar url={item.profile?.avatarUrl} name={name} size={48} />
                </View>
                <Text className="flex-1 text-foreground font-body-bold">{name}</Text>
                <Pressable
                  onPress={() => handleUnblock(item)}
                  className="flex-row items-center bg-green-50 border border-green-300 rounded-full px-4 py-2"
                >
                  <ShieldCheck size={16} color="#22c55e" />
                  <Text className="text-green-600 font-body-bold text-sm ml-1.5">Unblock</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
