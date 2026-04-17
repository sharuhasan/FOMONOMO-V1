import React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useConversations } from '../../../../src/api/hooks';
import Avatar from '../../../../src/components/Avatar';

export default function MessagesScreen() {
  const router = useRouter();
  const { data: conversations, isLoading, refetch } = useConversations();

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    return d.toLocaleDateString();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-display text-primary">Messages</Text>
      </View>

      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.partnerId}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">💬</Text>
            <Text className="text-muted-foreground">
              {isLoading ? 'Loading...' : 'No conversations yet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/(messages)/${item.partnerId}`)}
            className="flex-row items-center px-4 py-3 border-b border-border"
          >
            <View className="mr-3">
              <Avatar url={item.avatarUrl} name={item.displayName || item.fullName} size={48} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-body-bold text-foreground">
                  {item.displayName || item.fullName || 'User'}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatTime(item.lastMessageAt)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-0.5">
                <Text className="text-muted-foreground text-sm flex-1 mr-2" numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unreadCount > 0 && (
                  <View className="bg-primary rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-body-bold">{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
