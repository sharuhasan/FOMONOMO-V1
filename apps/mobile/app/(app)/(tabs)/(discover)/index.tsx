import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, MapPin, Users, Clock } from 'lucide-react-native';
import { useActivities } from '../../../../src/api/hooks';
import NotificationBell from '../../../../src/components/NotificationBell';
import Avatar from '../../../../src/components/Avatar';

const CATEGORIES = ['All', 'Sports', 'Food', 'Study', 'Music', 'Art', 'Social', 'Fitness', 'Gaming'];

const CATEGORY_EMOJI: Record<string, string> = {
  Sports: '⚽', Food: '🍕', Study: '📚', Music: '🎵',
  Art: '🎨', Social: '🎉', Fitness: '💪', Gaming: '🎮',
};

export default function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const params: Record<string, string> = { upcoming: 'true', limit: '20' };
  if (category !== 'All') params.category = category;
  if (search) params.search = search;

  const { data, isLoading, refetch } = useActivities(params);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Starting soon';
    if (diffHrs < 24) return `In ${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    return `In ${diffDays}d`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-display text-primary">Discover</Text>
          <NotificationBell />
        </View>

        <View className="flex-row items-center bg-card border border-border rounded-xl px-3 py-2 mb-3">
          <Search size={18} color="#999" />
          <TextInput
            className="flex-1 ml-2 text-foreground"
            placeholder="Search activities..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCategory(item)}
              className={`mr-2 px-4 py-2 rounded-full ${
                category === item ? 'bg-primary' : 'bg-card border border-border'
              }`}
            >
              <Text className={category === item ? 'text-white font-body-bold' : 'text-foreground'}>
                {item !== 'All' ? `${CATEGORY_EMOJI[item]} ` : ''}{item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl mb-4">🔍</Text>
            <Text className="text-muted-foreground">
              {isLoading ? 'Loading...' : 'No activities found'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/activity/${item.id}`)}
            className="bg-card border border-border rounded-2xl p-4 mb-3"
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-1">
                  <Text className="text-lg mr-2">{CATEGORY_EMOJI[item.category] ?? '🎯'}</Text>
                  <Text className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {item.category}
                  </Text>
                </View>
                <Text className="text-base font-body-bold text-foreground">{item.title}</Text>
              </View>
              <Text className="text-xs text-primary font-body-bold">{formatTime(item.scheduledTime)}</Text>
            </View>

            {item.description ? (
              <Text className="text-muted-foreground text-sm mb-2" numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#999" />
              <Text className="text-muted-foreground text-xs ml-1 flex-1" numberOfLines={1}>
                {item.location}
              </Text>
              <Users size={14} color="#999" />
              <Text className="text-muted-foreground text-xs ml-1">
                {item._count.participants}/{item.maxParticipants}
              </Text>
              <Clock size={14} color="#999" className="ml-3" />
              <Text className="text-muted-foreground text-xs ml-1">
                {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View className="flex-row items-center mt-2 pt-2 border-t border-border">
              <Avatar url={item.host.profile?.avatarUrl} name={item.host.profile?.displayName || item.host.fullName} size={24} />
              <Text className="text-xs text-muted-foreground ml-2">
                {item.host.profile?.displayName || item.host.fullName || 'Host'}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
