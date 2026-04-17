import React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, MessageCircle, Users, MapPin } from 'lucide-react-native';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../src/api/hooks';

const TYPE_ICONS: Record<string, any> = {
  join: Users,
  chat: MessageCircle,
  nearby: MapPin,
  reminder: Bell,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handlePress = (notification: any) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }

    const meta = notification.metadata;

    // DM notification → open conversation
    if (meta?.route === 'dm' && meta?.senderId) {
      router.push(`/(app)/(tabs)/(messages)/${meta.senderId}`);
      return;
    }

    // Activity chat notification → open activity with chat tab
    if (meta?.route === 'activity_chat' && meta?.activityId) {
      router.push(`/(app)/activity/${meta.activityId}?tab=chat`);
      return;
    }

    // Activity-related notification → open activity detail
    if (notification.activity?.id) {
      router.push(`/(app)/activity/${notification.activity.id}`);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <Text className="text-lg font-body-bold text-foreground flex-1">Notifications</Text>
        {data?.unreadCount ? (
          <Pressable
            onPress={() => markAllRead.mutate()}
            className="bg-primary rounded-full px-3 py-1"
          >
            <Text className="text-white text-xs font-body-bold">Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">🔔</Text>
            <Text className="text-muted-foreground">No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const Icon = TYPE_ICONS[item.type] ?? Bell;
          return (
            <Pressable
              onPress={() => handlePress(item)}
              className={`flex-row items-center px-4 py-3 border-b border-border ${
                !item.read ? 'bg-primary/5' : ''
              }`}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                !item.read ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <Icon size={18} color={!item.read ? '#FF6B6B' : '#999'} />
              </View>
              <View className="flex-1">
                <Text className={`text-sm ${!item.read ? 'font-body-bold text-foreground' : 'text-muted-foreground'}`}>
                  {item.message}
                </Text>
                {item.activity && (
                  <Text className="text-xs text-primary mt-0.5">{item.activity.title}</Text>
                )}
                <Text className="text-xs text-muted-foreground mt-0.5">{formatTime(item.createdAt)}</Text>
              </View>
              {!item.read && <View className="w-2 h-2 rounded-full bg-primary" />}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
