import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, Star, Edit3, Users, ShieldBan, ChevronRight, Clock, MapPin } from 'lucide-react-native';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useMyProfile, useUpdateProfile, useUserStats, useMyActivityHistory } from '../../../../src/api/hooks';
import NotificationBell from '../../../../src/components/NotificationBell';
import Avatar from '../../../../src/components/Avatar';

const CATEGORY_EMOJI: Record<string, string> = {
  Sports: '⚽', Food: '🍕', Study: '📚', Music: '🎵',
  Art: '🎨', Social: '🎉', Fitness: '💪', Gaming: '🎮',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { data: profile, refetch } = useMyProfile();
  const { data: stats } = useUserStats(user?.id ?? '');
  const updateProfile = useUpdateProfile();
  const { data: history } = useMyActivityHistory();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const startEdit = () => {
    setDisplayName(profile?.profile?.displayName ?? '');
    setBio(profile?.profile?.bio ?? '');
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await updateProfile.mutateAsync({ displayName, bio });
      setEditing(false);
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const statItems = [
    { label: 'Hosted', value: (stats as any)?.activitiesHosted ?? 0 },
    { label: 'Joined', value: (stats as any)?.activitiesJoined ?? 0 },
    { label: 'Rating', value: ((stats as any)?.averageRating ?? 0).toFixed(1) },
    { label: 'Reviews', value: (stats as any)?.totalReviews ?? 0 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-2xl font-display text-primary">Profile</Text>
        <View className="flex-row">
          <NotificationBell size={20} />
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Avatar + Name */}
        <View className="items-center py-6">
          <View className="mb-3">
            <Avatar url={profile?.profile?.avatarUrl} name={profile?.profile?.displayName || profile?.fullName || user?.fullName} size={96} />
          </View>

          {editing ? (
            <View className="w-full">
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-2 text-foreground text-center mb-2"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
                placeholderTextColor="#999"
              />
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-2 text-foreground text-center mb-3"
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                placeholderTextColor="#999"
                multiline
              />
              <View className="flex-row justify-center">
                <Pressable onPress={() => setEditing(false)} className="px-4 py-2 mr-2">
                  <Text className="text-muted-foreground">Cancel</Text>
                </Pressable>
                <Pressable onPress={saveEdit} className="bg-primary px-6 py-2 rounded-xl">
                  <Text className="text-white font-body-bold">Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Text className="text-xl font-body-bold text-foreground">
                {profile?.profile?.displayName || profile?.fullName || user?.fullName || 'User'}
              </Text>
              <Text className="text-muted-foreground mt-0.5">{profile?.email || user?.email}</Text>
              {profile?.profile?.bio ? (
                <Text className="text-foreground text-center mt-2 px-6">{profile.profile.bio}</Text>
              ) : null}
              <Pressable onPress={startEdit} className="flex-row items-center mt-3">
                <Edit3 size={14} color="#FF6B6B" />
                <Text className="text-primary ml-1 text-sm">Edit Profile</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row bg-card border border-border rounded-2xl p-4 mb-4">
          {statItems.map((s, i) => (
            <View key={s.label} className={`flex-1 items-center ${i < statItems.length - 1 ? 'border-r border-border' : ''}`}>
              <Text className="text-xl font-body-bold text-foreground">{s.value}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Interests */}
        {profile?.profile?.interests && profile.profile.interests.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-body-bold text-foreground mb-2">Interests</Text>
            <View className="flex-row flex-wrap">
              {profile.profile.interests.map((interest: string) => (
                <View key={interest} className="bg-primary/10 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-primary text-sm">{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Roles */}
        {user?.roles && user.roles.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-body-bold text-foreground mb-2">Roles</Text>
            <View className="flex-row flex-wrap">
              {user.roles.map((role: string) => (
                <View key={role} className="bg-card border border-border rounded-full px-3 py-1 mr-2">
                  <Text className="text-foreground text-sm capitalize">{role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
          <Pressable
            onPress={() => router.push('/(app)/friends')}
            className="flex-row items-center px-4 py-3.5 border-b border-border"
          >
            <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Users size={18} color="#FF6B6B" />
            </View>
            <Text className="flex-1 text-foreground font-body-bold">Friends</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/blocked')}
            className="flex-row items-center px-4 py-3.5"
          >
            <View className="w-9 h-9 rounded-full bg-red-50 items-center justify-center mr-3">
              <ShieldBan size={18} color="#EF4444" />
            </View>
            <Text className="flex-1 text-foreground font-body-bold">Blocked Users</Text>
            <ChevronRight size={18} color="#999" />
          </Pressable>
        </View>

        {/* Completed Activities */}
        {history && history.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-body-bold text-foreground mb-2">
              Completed Activities ({history.length})
            </Text>
            {history.slice(0, 10).map((a: any) => (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/(app)/activity/${a.id}`)}
                className="bg-card border border-border rounded-xl p-3 mb-2"
              >
                <View className="flex-row items-center mb-1">
                  <Text className="text-base mr-1.5">
                    {CATEGORY_EMOJI[a.category] ?? '🎯'}
                  </Text>
                  <Text className="flex-1 text-foreground font-body-bold" numberOfLines={1}>
                    {a.title}
                  </Text>
                  {a.hostId === user?.id && (
                    <View className="bg-primary/10 rounded-full px-2 py-0.5">
                      <Text className="text-primary text-[10px] font-body-bold">Host</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center">
                  <Clock size={12} color="#999" />
                  <Text className="text-xs text-muted-foreground ml-1">
                    {new Date(a.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                  <MapPin size={12} color="#999" style={{ marginLeft: 10 }} />
                  <Text className="text-xs text-muted-foreground ml-1 flex-1" numberOfLines={1}>
                    {a.location}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {a._count?.participants ?? 0} joined
                  </Text>
                </View>
              </Pressable>
            ))}
            {history.length > 10 && (
              <Text className="text-xs text-muted-foreground text-center mt-1">
                +{history.length - 10} more
              </Text>
            )}
          </View>
        )}

        {/* Sign Out */}
        <Pressable
          onPress={signOut}
          className="bg-destructive/10 rounded-xl py-3 items-center mt-4 mb-8"
        >
          <Text className="text-destructive font-body-bold">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
