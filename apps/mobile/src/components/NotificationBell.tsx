import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useNotifications } from '../api/hooks';

export default function NotificationBell({ size = 22 }: { size?: number }) {
  const router = useRouter();
  const { data } = useNotifications();
  const unread = data?.unreadCount ?? 0;

  return (
    <Pressable onPress={() => router.push('/(app)/notifications')} className="p-2">
      <Bell size={size} color="#666" />
      {unread > 0 && (
        <View className="absolute top-0.5 right-0.5 bg-primary rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text className="text-white text-[10px] font-body-bold">
            {unread > 99 ? '99+' : unread}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
