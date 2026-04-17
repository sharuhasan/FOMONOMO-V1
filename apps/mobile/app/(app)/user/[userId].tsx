import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, MessageCircle, ShieldBan, ShieldCheck, UserPlus, UserCheck, Clock, UserMinus } from 'lucide-react-native';
import {
  useProfile, useUserStats, useUserReviews,
  useBlockStatus, useBlockUser, useUnblockUser,
  useFriendshipStatus, useSendFriendRequest, useAcceptFriendRequest, useRemoveFriend, useWithdrawFriendRequest,
} from '../../../src/api/hooks';
import { useAuth } from '../../../src/contexts/AuthContext';
import Avatar from '../../../src/components/Avatar';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const { data: profileData, isLoading: loadingProfile } = useProfile(userId!);
  const { data: stats } = useUserStats(userId!);
  const { data: reviewsData } = useUserReviews(userId!);
  const { data: blockData } = useBlockStatus(userId!);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const { data: friendData } = useFriendshipStatus(userId!);
  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const removeFriend = useRemoveFriend();
  const withdrawRequest = useWithdrawFriendRequest();

  const isOwnProfile = currentUser?.id === userId;
  const isBlocked = blockData?.blocked ?? false;
  const friendStatus = friendData?.status ?? 'none';
  const friendDirection = friendData?.direction;

  if (loadingProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </SafeAreaView>
    );
  }

  const profile = profileData?.profile;
  const name = profile?.displayName || profileData?.fullName || 'User';
  const reviews = reviewsData?.reviews ?? reviewsData?.data ?? [];
  const avg = reviewsData?.average ?? reviewsData?.averageRating ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <Text className="text-lg font-body-bold text-foreground">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Avatar + Name */}
        <View className="items-center mb-6">
          <View className="mb-3">
            <Avatar url={profile?.avatarUrl} name={name} size={80} />
          </View>
          <Text className="text-xl font-body-bold text-foreground">{name}</Text>
          {profile?.bio ? (
            <Text className="text-muted-foreground text-center mt-1 px-8">{profile.bio}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View className="flex-row bg-card border border-border rounded-xl p-4 mb-4">
          <View className="flex-1 items-center">
            <Text className="text-lg font-body-bold text-foreground">{stats?.hosted ?? 0}</Text>
            <Text className="text-xs text-muted-foreground">Hosted</Text>
          </View>
          <View className="flex-1 items-center border-l border-border">
            <Text className="text-lg font-body-bold text-foreground">{stats?.joined ?? 0}</Text>
            <Text className="text-xs text-muted-foreground">Joined</Text>
          </View>
          <View className="flex-1 items-center border-l border-border">
            <View className="flex-row items-center">
              <Star size={14} color="#FFB800" fill="#FFB800" />
              <Text className="text-lg font-body-bold text-foreground ml-1">
                {Number(avg).toFixed(1)}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">{reviews.length} reviews</Text>
          </View>
        </View>

        {/* DM button */}
        {!isOwnProfile && (
          <Pressable
            onPress={() => router.push(`/(app)/(messages)/${userId}`)}
            className="flex-row items-center justify-center bg-primary rounded-xl py-3 mb-3"
          >
            <MessageCircle size={18} color="#fff" />
            <Text className="text-white font-body-bold ml-2">Send Message</Text>
          </Pressable>
        )}

        {/* Friend button */}
        {!isOwnProfile && (
          <Pressable
            onPress={() => {
              if (friendStatus === 'none' || friendStatus === 'rejected') {
                sendFriendRequest.mutate(userId!, {
                  onError: (err: any) => Alert.alert('Error', err.message || 'Failed to send request'),
                });
              } else if (friendStatus === 'pending' && friendDirection === 'incoming') {
                acceptFriendRequest.mutate(userId!, {
                  onSuccess: () => Alert.alert('Accepted!', `You and ${name} are now friends.`),
                });
              } else if (friendStatus === 'pending' && friendDirection === 'outgoing') {
                Alert.alert('Withdraw Request', `Cancel your friend request to ${name}?`, [
                  { text: 'Keep', style: 'cancel' },
                  {
                    text: 'Withdraw',
                    style: 'destructive',
                    onPress: () => withdrawRequest.mutate(userId!),
                  },
                ]);
              } else if (friendStatus === 'accepted') {
                Alert.alert('Remove Friend', `Remove ${name} from your friends?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeFriend.mutate(userId!),
                  },
                ]);
              }
            }}
            className={`flex-row items-center justify-center rounded-xl py-3 mb-3 border ${
              friendStatus === 'accepted'
                ? 'border-green-500 bg-green-50'
                : friendStatus === 'pending' && friendDirection === 'incoming'
                ? 'border-primary bg-primary'
                : friendStatus === 'pending' && friendDirection === 'outgoing'
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-primary bg-primary/10'
            }`}
          >
            {friendStatus === 'accepted' ? (
              <>
                <UserCheck size={18} color="#22c55e" />
                <Text className="text-green-600 font-body-bold ml-2">Friends</Text>
              </>
            ) : friendStatus === 'pending' && friendDirection === 'incoming' ? (
              <>
                <UserPlus size={18} color="#fff" />
                <Text className="text-white font-body-bold ml-2">Accept Request</Text>
              </>
            ) : friendStatus === 'pending' && friendDirection === 'outgoing' ? (
              <>
                <Clock size={18} color="#a16207" />
                <Text className="text-yellow-700 font-body-bold ml-2">Request Sent</Text>
              </>
            ) : (
              <>
                <UserPlus size={18} color="#FF6B6B" />
                <Text className="text-primary font-body-bold ml-2">Add Friend</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Block/Unblock button */}
        {!isOwnProfile && (
          <Pressable
            onPress={() => {
              if (isBlocked) {
                Alert.alert('Unblock User', `Unblock ${name}? They will be able to see your activities again.`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Unblock',
                    onPress: () => unblockUser.mutate(userId!, {
                      onSuccess: () => Alert.alert('Unblocked', `${name} has been unblocked.`),
                      onError: (err: any) => Alert.alert('Error', err.message || 'Failed to unblock user'),
                    }),
                  },
                ]);
              } else {
                Alert.alert('Block User', `Block ${name}? They won't see your activities and you won't see theirs.`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Block',
                    style: 'destructive',
                    onPress: () => blockUser.mutate(userId!, {
                      onSuccess: () => Alert.alert('Blocked', `${name} has been blocked.`),
                      onError: (err: any) => Alert.alert('Error', err.message || 'Failed to block user'),
                    }),
                  },
                ]);
              }
            }}
            className={`flex-row items-center justify-center rounded-xl py-3 mb-6 border ${
              isBlocked ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'
            }`}
          >
            {isBlocked ? (
              <>
                <ShieldCheck size={18} color="#22c55e" />
                <Text className="text-green-600 font-body-bold ml-2">Unblock User</Text>
              </>
            ) : (
              <>
                <ShieldBan size={18} color="#ef4444" />
                <Text className="text-red-500 font-body-bold ml-2">Block User</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Interests */}
        {profile?.interests?.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-body-bold text-foreground mb-2">Interests</Text>
            <View className="flex-row flex-wrap">
              {profile.interests.map((interest: string) => (
                <View key={interest} className="bg-primary/10 rounded-full px-3 py-1.5 mr-2 mb-2">
                  <Text className="text-primary text-sm">{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        <Text className="text-sm font-body-bold text-foreground mb-2">
          Reviews ({reviews.length})
        </Text>
        {reviews.length === 0 ? (
          <View className="bg-card border border-border rounded-xl p-4 mb-8">
            <Text className="text-muted-foreground text-center">No reviews yet</Text>
          </View>
        ) : (
          <View className="mb-8">
            {reviews.map((r: any, i: number) => (
              <View key={r.id || i} className="bg-card border border-border rounded-xl p-3 mb-2">
                <View className="flex-row items-center mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={12} color="#FFB800" fill={s <= r.rating ? '#FFB800' : 'transparent'} />
                  ))}
                  <Text className="text-xs text-muted-foreground ml-2">
                    {r.reviewer?.profile?.displayName || r.reviewer?.fullName || 'User'}
                  </Text>
                </View>
                {r.text ? <Text className="text-sm text-foreground mt-1">{r.text}</Text> : null}
                {r.tags?.length > 0 && (
                  <View className="flex-row flex-wrap mt-1.5">
                    {r.tags.map((t: string) => (
                      <Text key={t} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 mr-1 mb-0.5">
                        {t}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
