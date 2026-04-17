import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Star, Check, X, UserMinus } from 'lucide-react-native';
import {
  useFriends,
  useIncomingFriendRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useUserReviews,
} from '../../src/api/hooks';
import Avatar from '../../src/components/Avatar';

function FriendRating({ userId }: { userId: string }) {
  const { data } = useUserReviews(userId);
  const reviews = data?.reviews ?? data?.data ?? [];
  const avg = data?.average ?? data?.averageRating;
  if (reviews.length === 0) return <Text className="text-xs text-muted-foreground">New</Text>;
  return (
    <View className="flex-row items-center">
      <Star size={12} color="#FFB800" fill="#FFB800" />
      <Text className="text-sm font-body-bold text-foreground ml-0.5">{Number(avg).toFixed(1)}</Text>
    </View>
  );
}

export default function FriendsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');

  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: incoming, isLoading: loadingRequests } = useIncomingFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();

  const requestCount = incoming?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <Text className="text-lg font-body-bold text-foreground flex-1">Friends</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-border">
        <Pressable
          onPress={() => setTab('friends')}
          className={`flex-1 py-3 items-center ${tab === 'friends' ? 'border-b-2 border-primary' : ''}`}
        >
          <Text className={tab === 'friends' ? 'text-primary font-body-bold' : 'text-muted-foreground'}>
            Friends ({friends?.length ?? 0})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('requests')}
          className={`flex-1 py-3 items-center ${tab === 'requests' ? 'border-b-2 border-primary' : ''}`}
        >
          <View className="flex-row items-center">
            <Text className={tab === 'requests' ? 'text-primary font-body-bold' : 'text-muted-foreground'}>
              Requests
            </Text>
            {requestCount > 0 && (
              <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 ml-1.5">
                <Text className="text-white text-[11px] font-body-bold">{requestCount}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {tab === 'friends' ? (
        loadingFriends ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : (
          <FlatList
            data={friends ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text className="text-5xl mb-4">👥</Text>
                <Text className="text-muted-foreground text-center">
                  No friends yet. Send friend requests from user profiles!
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const name = item.profile?.displayName || item.fullName || 'User';
              return (
                <Pressable
                  onPress={() => router.push(`/(app)/user/${item.id}`)}
                  className="flex-row items-center bg-card border border-border rounded-xl p-3 mb-2"
                >
                  <View className="mr-3">
                    <Avatar url={item.profile?.avatarUrl} name={name} size={48} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-body-bold">{name}</Text>
                    {item.profile?.bio ? (
                      <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                        {item.profile.bio}
                      </Text>
                    ) : null}
                  </View>
                  <FriendRating userId={item.id} />
                  <Pressable
                    onPress={() => router.push(`/(app)/(tabs)/(messages)/${item.id}`)}
                    className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center ml-2"
                  >
                    <MessageCircle size={18} color="#FF6B6B" />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Remove Friend', `Remove ${name} from your friends?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => removeFriend.mutate(item.id),
                        },
                      ])
                    }
                    className="ml-1.5"
                  >
                    <UserMinus size={18} color="#999" />
                  </Pressable>
                </Pressable>
              );
            }}
          />
        )
      ) : (
        loadingRequests ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : (
          <FlatList
            data={incoming ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text className="text-5xl mb-4">📬</Text>
                <Text className="text-muted-foreground text-center">
                  No pending friend requests
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const name = item.profile?.displayName || item.fullName || 'User';
              return (
                <View className="flex-row items-center bg-card border border-border rounded-xl p-3 mb-2">
                  <Pressable
                    onPress={() => router.push(`/(app)/user/${item.id}`)}
                    className="flex-row items-center flex-1"
                  >
                    <View className="mr-3">
                      <Avatar url={item.profile?.avatarUrl} name={name} size={48} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-body-bold">{name}</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">Wants to be your friend</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => acceptRequest.mutate(item.id)}
                    className="bg-green-500 w-10 h-10 rounded-full items-center justify-center mr-2"
                  >
                    <Check size={20} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => rejectRequest.mutate(item.id)}
                    className="bg-red-400 w-10 h-10 rounded-full items-center justify-center"
                  >
                    <X size={20} color="#fff" />
                  </Pressable>
                </View>
              );
            }}
          />
        )
      )}
    </SafeAreaView>
  );
}
