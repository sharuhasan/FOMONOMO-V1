import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, TextInput, ActivityIndicator, Alert, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, Region } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Users, Clock, Send, Trash2, Star, Check, X, Pencil } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { DEFAULT_REVIEW_DELAY_MINUTES, DURATION_OPTIONS, DURATION_UNITS, DurationUnit } from '../../../src/constants/config';
import {
  useActivity,
  useJoinActivity,
  useLeaveActivity,
  useDeleteActivity,
  useActivityMessages,
  useSendActivityMessage,
  useCreateReview,
  useUserReviews,
  usePendingRequests,
  useApproveRequest,
  useRejectRequest,
  useRemoveMember,
  useUpdateActivity,
  useActivityChatSuggestions,
} from '../../../src/api/hooks';
import ChatSuggestions from '../../../src/components/ChatSuggestions';
import Avatar from '../../../src/components/Avatar';

const CATEGORY_EMOJI: Record<string, string> = {
  Sports: '⚽', Food: '🍕', Study: '📚', Music: '🎵',
  Art: '🎨', Social: '🎉', Fitness: '💪', Gaming: '🎮',
};

const REVIEW_TAGS = ['Great host', 'Fun time', 'Good vibes', 'Well organized', 'Friendly', 'On time', 'Would join again'];

function UserRatingBadge({ userId }: { userId: string }) {
  const { data, isLoading } = useUserReviews(userId);
  if (isLoading) return null;
  const reviews = data?.reviews ?? data?.data ?? [];
  const avg = data?.average ?? data?.averageRating;
  if (reviews.length === 0) return <Text className="text-xs text-muted-foreground">New user</Text>;
  return (
    <View className="flex-row items-center">
      <Star size={12} color="#FFB800" fill="#FFB800" />
      <Text className="text-sm font-body-bold text-foreground ml-0.5">{Number(avg).toFixed(1)}</Text>
      <Text className="text-xs text-muted-foreground ml-1">({reviews.length})</Text>
    </View>
  );
}

function ParticipantReviews({ userId }: { userId: string }) {
  const { data, isLoading } = useUserReviews(userId);
  if (isLoading) return <ActivityIndicator size="small" color="#FF6B6B" style={{ padding: 8 }} />;
  const reviews = data?.reviews ?? data?.data ?? [];
  const avg = data?.average ?? data?.averageRating;
  const count = reviews.length;
  if (count === 0) {
    return (
      <View className="px-3 pb-3 pt-1">
        <Text className="text-xs text-muted-foreground">No reviews yet</Text>
      </View>
    );
  }
  return (
    <View className="px-3 pb-3 pt-1">
      <View className="flex-row items-center mb-2">
        <Star size={13} color="#FFB800" fill="#FFB800" />
        <Text className="text-sm font-body-bold text-foreground ml-1">
          {Number(avg).toFixed(1)}
        </Text>
        <Text className="text-xs text-muted-foreground ml-1">({count} review{count !== 1 ? 's' : ''})</Text>
      </View>
      {reviews.slice(0, 3).map((r: any, i: number) => (
        <View key={r.id || i} className="bg-muted/30 rounded-lg px-3 py-2 mb-1.5">
          <View className="flex-row items-center mb-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={10} color="#FFB800" fill={s <= r.rating ? '#FFB800' : 'transparent'} />
            ))}
            <Text className="text-[10px] text-muted-foreground ml-2">
              {r.reviewer?.profile?.displayName || r.reviewer?.fullName || 'User'}
            </Text>
          </View>
          {r.text ? <Text className="text-xs text-foreground">{r.text}</Text> : null}
          {r.tags?.length > 0 && (
            <View className="flex-row flex-wrap mt-1">
              {r.tags.map((t: string) => (
                <Text key={t} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 mr-1 mb-0.5">{t}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
      {count > 3 && (
        <Text className="text-xs text-muted-foreground mt-1">+{count - 3} more reviews</Text>
      )}
    </View>
  );
}

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onRate(star)}>
          <Star
            size={32}
            color="#FFB800"
            fill={star <= rating ? '#FFB800' : 'transparent'}
            strokeWidth={1.5}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function ActivityDetailScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'details' | 'chat' | 'review'>(
    initialTab === 'chat' ? 'chat' : initialTab === 'review' ? 'review' : 'details'
  );
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMaxParticipants, setEditMaxParticipants] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editLat, setEditLat] = useState(0);
  const [editLng, setEditLng] = useState(0);
  const [editSuggestions, setEditSuggestions] = useState<any[]>([]);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editCustomDuration, setEditCustomDuration] = useState(false);
  const [editCustomDurationValue, setEditCustomDurationValue] = useState('');
  const [editCustomDurationUnit, setEditCustomDurationUnit] = useState<DurationUnit>(DURATION_UNITS[0]);
  const [showEditUnitDropdown, setShowEditUnitDropdown] = useState(false);
  const editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editMapRef = useRef<MapView>(null);

  // Review state
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewedUsers, setReviewedUsers] = useState<Set<string>>(new Set());

  const { data: activity, isLoading } = useActivity(id!);
  const joinMutation = useJoinActivity();
  const leaveMutation = useLeaveActivity();
  const deleteMutation = useDeleteActivity();
  const { data: messages, refetch: refetchMessages } = useActivityMessages(id!);
  const sendMessage = useSendActivityMessage();
  const createReview = useCreateReview();
  const { data: pendingRequests, refetch: refetchPending } = usePendingRequests(id!);
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const removeMemberMutation = useRemoveMember();
  const updateActivity = useUpdateActivity();
  const { data: chatSuggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useActivityChatSuggestions(id!);

  const searchEditPlaces = useCallback(async (query: string) => {
    if (query.length < 3) {
      setEditSuggestions([]);
      setShowEditSuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'SpontaneousSocial/1.0' } },
      );
      const data = await res.json();
      setEditSuggestions(data);
      setShowEditSuggestions(data.length > 0);
    } catch {
      setEditSuggestions([]);
    }
  }, []);

  if (isLoading || !activity) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </SafeAreaView>
    );
  }

  const isHost = activity.hostId === user?.id;
  const isParticipant = activity.myStatus === 'approved';
  const isPending = activity.myStatus === 'pending';
  const isRejected = activity.myStatus === 'rejected';
  const isFull = (activity._count?.participants ?? 0) >= activity.maxParticipants;
  const reviewUnlockTime = new Date(activity.scheduledTime);
  if (activity.durationMinutes) {
    reviewUnlockTime.setMinutes(reviewUnlockTime.getMinutes() + activity.durationMinutes);
  } else {
    reviewUnlockTime.setMinutes(reviewUnlockTime.getMinutes() + DEFAULT_REVIEW_DELAY_MINUTES);
  }
  const isPast = reviewUnlockTime < new Date();
  const pendingList = pendingRequests ?? [];

  const startEditing = () => {
    setEditTitle(activity.title);
    setEditDescription(activity.description || '');
    setEditLocation(activity.location);
    setEditMaxParticipants(String(activity.maxParticipants));
    setEditDate(new Date(activity.scheduledTime));
    setEditLat(activity.lat || 0);
    setEditLng(activity.lng || 0);
    const dur = activity.durationMinutes ?? null;
    setEditDuration(dur);
    const presetValues = [null, 15, 30, 45, 60, 90, 120, 180, 240];
    const isCustom = dur != null && !presetValues.includes(dur);
    setEditCustomDuration(isCustom);
    if (isCustom && dur != null) {
      if (dur >= 60 && dur % 60 === 0) {
        setEditCustomDurationUnit(DURATION_UNITS[1]);
        setEditCustomDurationValue(String(dur / 60));
      } else {
        setEditCustomDurationUnit(DURATION_UNITS[0]);
        setEditCustomDurationValue(String(dur));
      }
    } else {
      setEditCustomDurationValue('');
      setEditCustomDurationUnit(DURATION_UNITS[0]);
    }
    setShowEditUnitDropdown(false);
    setEditSuggestions([]);
    setShowEditSuggestions(false);
    setEditing(true);
  };

  const handleEditLocationChange = (text: string) => {
    setEditLocation(text);
    if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
    editDebounceRef.current = setTimeout(() => searchEditPlaces(text), 400);
  };

  const selectEditSuggestion = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const parts = place.display_name.split(', ');
    setEditLocation(parts.slice(0, 3).join(', '));
    setEditLat(lat);
    setEditLng(lng);
    setEditSuggestions([]);
    setShowEditSuggestions(false);
    editMapRef.current?.animateToRegion({
      latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01,
    }, 500);
  };

  const saveEdit = async () => {
    try {
      await updateActivity.mutateAsync({
        id: id!,
        data: {
          title: editTitle.trim(),
          description: editDescription.trim(),
          location: editLocation.trim(),
          lat: editLat,
          lng: editLng,
          maxParticipants: parseInt(editMaxParticipants) || activity.maxParticipants,
          durationMinutes: editDuration,
          scheduledTime: editDate.toISOString(),
        },
      });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update');
    }
  };

  // Other participants (exclude self) for review
  const otherParticipants = (activity.participants ?? []).filter(
    (p: any) => p.userId !== user?.id
  );

  const handleSend = async () => {
    if (!message.trim()) return;
    await sendMessage.mutateAsync({ activityId: id!, content: message.trim() });
    setMessage('');
    refetchMessages();
  };

  const toggleTag = (tag: string) => {
    setReviewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget || reviewRating === 0) {
      Alert.alert('Missing rating', 'Please select a star rating');
      return;
    }
    try {
      await createReview.mutateAsync({
        revieweeId: reviewTarget.id,
        rating: reviewRating,
        text: reviewText.trim() || undefined,
        tags: reviewTags.length > 0 ? reviewTags : undefined,
      });
      setReviewedUsers((prev) => new Set(prev).add(reviewTarget.id));
      setReviewTarget(null);
      setReviewRating(0);
      setReviewText('');
      setReviewTags([]);
      Alert.alert('Thanks!', `Your review for ${reviewTarget.name} has been submitted.`);
    } catch (e: any) {
      const msg = e.message?.includes('already') ? 'You already reviewed this person' : e.message;
      Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <Text className="flex-1 text-lg font-body-bold text-foreground" numberOfLines={1}>
          {activity.title}
        </Text>
        {isHost && !isPast && (
          <Pressable onPress={startEditing} className="mr-3">
            <Pencil size={20} color="#FF6B6B" />
          </Pressable>
        )}
        {isHost && (
          <Pressable
            onPress={() =>
              Alert.alert('Delete Activity', 'Are you sure? This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteMutation.mutateAsync(id!);
                    router.back();
                  },
                },
              ])
            }
            className="mr-3"
          >
            <Trash2 size={20} color="#EF4444" />
          </Pressable>
        )}
        <Text className="text-lg">{CATEGORY_EMOJI[activity.category] ?? '🎯'}</Text>
      </View>

      {/* Tab switcher */}
      <View className="flex-row border-b border-border">
        <Pressable onPress={() => setTab('details')} className={`flex-1 py-3 items-center ${tab === 'details' ? 'border-b-2 border-primary' : ''}`}>
          <Text className={tab === 'details' ? 'text-primary font-body-bold' : 'text-muted-foreground'}>Details</Text>
        </Pressable>
        <Pressable onPress={() => setTab('chat')} className={`flex-1 py-3 items-center ${tab === 'chat' ? 'border-b-2 border-primary' : ''}`}>
          <Text className={tab === 'chat' ? 'text-primary font-body-bold' : 'text-muted-foreground'}>Chat</Text>
        </Pressable>
        {isPast && isParticipant && (
          <Pressable onPress={() => setTab('review')} className={`flex-1 py-3 items-center ${tab === 'review' ? 'border-b-2 border-primary' : ''}`}>
            <Text className={tab === 'review' ? 'text-primary font-body-bold' : 'text-muted-foreground'}>Reviews</Text>
          </Pressable>
        )}
      </View>

      {tab === 'details' ? (
        <ScrollView className="flex-1 px-4 pt-4">
          {editing ? (
            <View className="bg-card border border-primary rounded-2xl p-4 mb-4">
              <Text className="text-sm font-body-bold text-muted-foreground mb-1">Title</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-foreground mb-3"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Activity title"
                placeholderTextColor="#999"
              />
              <Text className="text-sm font-body-bold text-muted-foreground mb-1">Description</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-foreground mb-3"
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text className="text-sm font-body-bold text-muted-foreground mb-1">Location</Text>
              <View className="relative z-10">
                <TextInput
                  className="bg-background border border-border rounded-xl px-3 py-2 text-foreground"
                  value={editLocation}
                  onChangeText={handleEditLocationChange}
                  placeholder="Search location..."
                  placeholderTextColor="#999"
                />
                {showEditSuggestions && editSuggestions.length > 0 && (
                  <View className="bg-card border border-border rounded-xl mt-1 overflow-hidden" style={{ maxHeight: 180 }}>
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                      {editSuggestions.map((place, idx) => {
                        const parts = place.display_name.split(', ');
                        return (
                          <Pressable
                            key={place.place_id ?? idx}
                            onPress={() => selectEditSuggestion(place)}
                            className="px-3 py-2.5 border-b border-border"
                          >
                            <Text className="text-foreground text-sm" numberOfLines={1}>{parts[0]}</Text>
                            <Text className="text-muted-foreground text-xs" numberOfLines={1}>{parts.slice(1, 4).join(', ')}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
              {editLat !== 0 && editLng !== 0 && (
                <View className="rounded-xl overflow-hidden mt-2 border border-border" style={{ height: 160 }}>
                  <MapView
                    ref={editMapRef}
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={{
                      latitude: editLat, longitude: editLng,
                      latitudeDelta: 0.01, longitudeDelta: 0.01,
                    }}
                    onPress={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      setEditLat(latitude);
                      setEditLng(longitude);
                    }}
                  >
                    <Marker
                      coordinate={{ latitude: editLat, longitude: editLng }}
                      draggable
                      onDragEnd={(e) => {
                        setEditLat(e.nativeEvent.coordinate.latitude);
                        setEditLng(e.nativeEvent.coordinate.longitude);
                      }}
                    />
                  </MapView>
                </View>
              )}
              <View className="mb-3" />
              <Text className="text-sm font-body-bold text-muted-foreground mb-1">Max Participants</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-foreground mb-3"
                value={editMaxParticipants}
                onChangeText={setEditMaxParticipants}
                placeholder="10"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
              <Text className="text-sm font-body-bold text-muted-foreground mb-1">Duration (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                <Pressable
                  onPress={() => { setEditCustomDuration(true); setEditDuration(null); setEditCustomDurationValue(''); setShowEditUnitDropdown(false); }}
                  className={`mr-2 px-3 py-2 rounded-xl ${
                    editCustomDuration ? 'bg-primary' : 'bg-background border border-border'
                  }`}
                >
                  <Text className={editCustomDuration ? 'text-white text-sm font-body-bold' : 'text-foreground text-sm'}>Custom</Text>
                </Pressable>
                {DURATION_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => { setEditDuration(opt.value); setEditCustomDuration(false); setShowEditUnitDropdown(false); }}
                    className={`mr-2 px-3 py-2 rounded-xl ${
                      !editCustomDuration && editDuration === opt.value ? 'bg-primary' : 'bg-background border border-border'
                    }`}
                  >
                    <Text className={!editCustomDuration && editDuration === opt.value ? 'text-white text-sm font-body-bold' : 'text-foreground text-sm'}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {editCustomDuration && (
                <View className="flex-row items-center mb-3" style={{ zIndex: 20 }}>
                  <TextInput
                    className="bg-background border border-border rounded-xl px-3 py-2 text-foreground flex-1 mr-2"
                    placeholder={editCustomDurationUnit.multiplier >= 60 ? 'e.g. 1.5' : 'e.g. 75'}
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={editCustomDurationValue}
                    onChangeText={(t) => {
                      setEditCustomDurationValue(t);
                      const num = parseFloat(t);
                      if (!isNaN(num) && num > 0) {
                        setEditDuration(Math.round(num * editCustomDurationUnit.multiplier));
                      } else {
                        setEditDuration(null);
                      }
                    }}
                  />
                  <View style={{ position: 'relative' }}>
                    <Pressable
                      onPress={() => setShowEditUnitDropdown(!showEditUnitDropdown)}
                      className="bg-background border border-border rounded-xl px-3 py-2 flex-row items-center"
                    >
                      <Text className="text-foreground font-body-bold text-sm mr-1">{editCustomDurationUnit.label}</Text>
                      <Text className="text-muted-foreground text-xs">{showEditUnitDropdown ? '▲' : '▼'}</Text>
                    </Pressable>
                    {showEditUnitDropdown && (
                      <View className="bg-card border border-border rounded-xl overflow-hidden" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4, zIndex: 30 }}>
                        {DURATION_UNITS.map((u) => (
                          <Pressable
                            key={u.label}
                            onPress={() => {
                              setEditCustomDurationUnit(u);
                              setShowEditUnitDropdown(false);
                              const num = parseFloat(editCustomDurationValue);
                              if (!isNaN(num) && num > 0) {
                                setEditDuration(Math.round(num * u.multiplier));
                              }
                            }}
                            className={`px-4 py-2.5 border-b border-border ${editCustomDurationUnit.label === u.label ? 'bg-primary/10' : ''}`}
                          >
                            <Text className={editCustomDurationUnit.label === u.label ? 'text-primary font-body-bold text-sm' : 'text-foreground text-sm'}>{u.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
              {!editCustomDuration && <View className="mb-1" />}
              <Text className="text-sm font-body-bold text-muted-foreground mb-1">Date</Text>
              <Pressable
                onPress={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
                className="bg-background border border-border rounded-xl px-3 py-2.5 mb-2"
              >
                <Text className="text-foreground">
                  {editDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </Pressable>
              {showDatePicker && (
                <View className="bg-background border border-border rounded-xl mb-2 overflow-hidden">
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    themeVariant="light"
                    minimumDate={new Date()}
                    onChange={(_, selected) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (selected) setEditDate(prev => {
                        const d = new Date(selected);
                        d.setHours(prev.getHours(), prev.getMinutes());
                        return d;
                      });
                    }}
                  />
                </View>
              )}
              <Text className="text-sm font-body-bold text-muted-foreground mb-1">Time</Text>
              <Pressable
                onPress={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
                className="bg-background border border-border rounded-xl px-3 py-2.5 mb-2"
              >
                <Text className="text-foreground">
                  {editDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
              {showTimePicker && (
                <View className="bg-background border border-border rounded-xl mb-2 overflow-hidden">
                  <DateTimePicker
                    value={editDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="light"
                    onChange={(_, selected) => {
                      if (Platform.OS === 'android') setShowTimePicker(false);
                      if (selected) setEditDate(prev => {
                        const d = new Date(prev);
                        d.setHours(selected.getHours(), selected.getMinutes());
                        return d;
                      });
                    }}
                  />
                </View>
              )}
              <View className="flex-row">
                <Pressable onPress={() => setEditing(false)} className="flex-1 py-3 items-center mr-2 border border-border rounded-xl">
                  <Text className="text-muted-foreground font-body-bold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={saveEdit}
                  disabled={updateActivity.isPending}
                  className="flex-1 py-3 items-center bg-primary rounded-xl"
                >
                  <Text className="text-white font-body-bold">
                    {updateActivity.isPending ? 'Saving...' : 'Save Changes'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <Text className="text-xl font-body-bold text-foreground mb-2">{activity.title}</Text>
            {activity.description ? (
              <Text className="text-muted-foreground mb-3">{activity.description}</Text>
            ) : null}

            <View className="flex-row items-center mb-2">
              <MapPin size={16} color="#999" />
              <Text className="text-foreground ml-2">{activity.location}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Clock size={16} color="#999" />
              <Text className="text-foreground ml-2">
                {new Date(activity.scheduledTime).toLocaleDateString()} at{' '}
                {new Date(activity.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {activity.durationMinutes ? ` (${activity.durationMinutes >= 60 ? `${activity.durationMinutes / 60}h` : `${activity.durationMinutes}min`})` : ''}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Users size={16} color="#999" />
              <Text className="text-foreground ml-2">
                {activity._count?.participants ?? 0} / {activity.maxParticipants} participants
              </Text>
            </View>
            {isPast && (
              <View className="mt-3 bg-muted/50 rounded-lg px-3 py-2">
                <Text className="text-muted-foreground text-sm">This activity has ended</Text>
              </View>
            )}
          </View>
          )}

          {/* Host */}
          <Text className="text-sm font-body-bold text-foreground mb-2">Hosted by</Text>
          <Pressable
            onPress={() => router.push(`/(app)/user/${activity.hostId}`)}
            className="flex-row items-center bg-card border border-border rounded-xl p-3 mb-4"
          >
            <View className="mr-3">
              <Avatar url={activity.host?.profile?.avatarUrl} name={activity.host?.profile?.displayName || activity.host?.fullName} size={40} />
            </View>
            <Text className="flex-1 text-foreground font-body-bold">
              {activity.host?.profile?.displayName || activity.host?.fullName || 'Host'}
            </Text>
            <UserRatingBadge userId={activity.hostId} />
          </Pressable>

          {/* Participants */}
          <Text className="text-sm font-body-bold text-foreground mb-2">
            Participants ({activity.participants?.length ?? 0})
          </Text>
          <View className="bg-card border border-border rounded-xl mb-4">
            {activity.participants?.map((p: any) => {
              const name = p.user?.profile?.displayName || p.user?.fullName || 'User';
              const canRemove = isHost && p.userId !== user?.id;
              return (
                <View key={p.id} className="flex-row items-center p-3 border-b border-border last:border-b-0">
                  <Pressable
                    onPress={() => router.push(`/(app)/user/${p.userId}`)}
                    className="flex-row items-center flex-1"
                  >
                    <View className="mr-3">
                      <Avatar url={p.user?.profile?.avatarUrl} name={name} size={32} />
                    </View>
                    <Text className="flex-1 text-foreground font-body-bold">{name}</Text>
                    <UserRatingBadge userId={p.userId} />
                  </Pressable>
                  {canRemove && (
                    <Pressable
                      onPress={() =>
                        Alert.alert('Remove Member', `Remove ${name} from this activity?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeMemberMutation.mutate({ activityId: id!, userId: p.userId }),
                          },
                        ])
                      }
                      className="ml-2 bg-red-100 w-8 h-8 rounded-full items-center justify-center"
                    >
                      <X size={16} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          {/* Host: Pending requests */}
          {isHost && pendingList.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-body-bold text-foreground mb-2">
                Join Requests ({pendingList.length})
              </Text>
              {pendingList.map((req: any) => {
                const name = req.user?.profile?.displayName || req.user?.fullName || 'User';
                return (
                  <View key={req.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-2">
                    <View className="flex-row items-center">
                      <Pressable
                        onPress={() => router.push(`/(app)/user/${req.userId}`)}
                        className="flex-row items-center flex-1"
                      >
                        <View className="mr-3">
                          <Avatar url={req.user?.profile?.avatarUrl} name={name} size={40} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-foreground font-body-bold">{name}</Text>
                          <UserRatingBadge userId={req.userId} />
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          await approveMutation.mutateAsync({ activityId: id!, userId: req.userId });
                          refetchPending();
                        }}
                        className="bg-green-500 w-9 h-9 rounded-full items-center justify-center mr-2"
                      >
                        <Check size={18} color="#fff" />
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          await rejectMutation.mutateAsync({ activityId: id!, userId: req.userId });
                          refetchPending();
                        }}
                        className="bg-red-400 w-9 h-9 rounded-full items-center justify-center"
                      >
                        <X size={18} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Join/Leave/Pending button — only for non-hosts on upcoming activities */}
          {!isHost && !isPast && (
            <Pressable
              onPress={() => {
                if (isParticipant) {
                  leaveMutation.mutate(id!);
                } else if (isPending) {
                  Alert.alert('Withdraw Request', 'Cancel your join request?', [
                    { text: 'Keep', style: 'cancel' },
                    {
                      text: 'Withdraw',
                      style: 'destructive',
                      onPress: () => leaveMutation.mutate(id!),
                    },
                  ]);
                } else if (isRejected) {
                  joinMutation.mutate(id!);
                } else {
                  joinMutation.mutate(id!);
                }
              }}
              disabled={joinMutation.isPending || leaveMutation.isPending || (!isParticipant && !isPending && !isRejected && isFull)}
              className={`rounded-xl py-4 items-center mb-8 ${
                isParticipant ? 'bg-destructive/10' :
                isPending ? 'bg-yellow-50 border border-yellow-300' :
                isRejected ? 'bg-orange-50 border border-orange-300' :
                isFull ? 'bg-muted' : 'bg-primary'
              }`}
            >
              <Text className={`font-body-bold ${
                isParticipant ? 'text-destructive' :
                isPending ? 'text-yellow-700' :
                isRejected ? 'text-orange-600' :
                isFull ? 'text-muted-foreground' : 'text-white'
              }`}>
                {isParticipant ? 'Leave Activity' :
                 isPending ? 'Request Pending...' :
                 isRejected ? 'Request Again' :
                 isFull ? 'Activity Full' : 'Request to Join'}
              </Text>
            </Pressable>
          )}

          {/* Prompt to review for past activities */}
          {isPast && isParticipant && otherParticipants.length > 0 && (
            <Pressable
              onPress={() => setTab('review')}
              className="bg-yellow-50 border border-yellow-200 rounded-xl py-4 items-center mb-8"
            >
              <View className="flex-row items-center">
                <Star size={18} color="#FFB800" fill="#FFB800" />
                <Text className="text-yellow-700 font-body-bold ml-2">Rate your fellow participants</Text>
              </View>
            </Pressable>
          )}
        </ScrollView>
      ) : tab === 'chat' ? (
        /* Chat Tab */
        <View className="flex-1">
          <FlatList
            data={messages?.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-muted-foreground">
                  {isParticipant ? 'No messages yet. Say hello!' : 'Join to chat'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.user?.id === user?.id;
              return (
                <View className={`mb-2 ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <Text className="text-xs text-muted-foreground mb-0.5">
                      {item.user?.profile?.displayName || item.user?.fullName || 'User'}
                    </Text>
                  )}
                  <View className={`px-3 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-primary' : 'bg-card border border-border'}`}>
                    <Text className={isMe ? 'text-white' : 'text-foreground'}>{item.content}</Text>
                  </View>
                </View>
              );
            }}
          />
          {isParticipant && (
            <>
              <ChatSuggestions
                suggestions={chatSuggestions}
                isLoading={suggestionsLoading}
                onSelect={(text) => { setMessage(text); }}
                onRefresh={() => refetchSuggestions()}
              />
              <View className="flex-row items-center px-4 py-2 border-t border-border">
                <TextInput
                  className="flex-1 bg-card border border-border rounded-full px-4 py-2 text-foreground mr-2"
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  value={message}
                  onChangeText={setMessage}
                />
                <Pressable onPress={handleSend} className="bg-primary w-10 h-10 rounded-full items-center justify-center">
                  <Send size={18} color="#fff" />
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : (
        /* Review Tab */
        <ScrollView className="flex-1 px-4 pt-4">
          {!reviewTarget ? (
            /* Participant list to review */
            <View>
              <Text className="text-lg font-body-bold text-foreground mb-1">Rate Participants</Text>
              <Text className="text-sm text-muted-foreground mb-4">
                Tap someone to leave a review
              </Text>

              {otherParticipants.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="text-muted-foreground">No other participants to review</Text>
                </View>
              ) : (
                otherParticipants.map((p: any) => {
                  const name = p.user?.profile?.displayName || p.user?.fullName || 'User';
                  const alreadyReviewed = reviewedUsers.has(p.userId);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => !alreadyReviewed && setReviewTarget({ id: p.userId, name })}
                      className={`flex-row items-center bg-card border border-border rounded-xl p-4 mb-3 ${alreadyReviewed ? 'opacity-50' : ''}`}
                    >
                      <View className="mr-3">
                        <Avatar url={p.user?.profile?.avatarUrl} name={name} size={48} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground font-body-bold text-base">{name}</Text>
                        {alreadyReviewed && (
                          <View className="flex-row items-center mt-1">
                            <Star size={12} color="#FFB800" fill="#FFB800" />
                            <Text className="text-xs text-muted-foreground ml-1">Reviewed</Text>
                          </View>
                        )}
                      </View>
                      {!alreadyReviewed && (
                        <View className="bg-primary/10 rounded-full px-3 py-1.5">
                          <Text className="text-primary text-sm font-body-bold">Rate</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : (
            /* Review form */
            <View>
              <Pressable onPress={() => { setReviewTarget(null); setReviewRating(0); setReviewText(''); setReviewTags([]); }}>
                <Text className="text-primary font-body-bold mb-4">← Back to participants</Text>
              </Pressable>

              <View className="items-center mb-6">
                <View className="mb-3">
                  <Avatar name={reviewTarget.name} size={64} />
                </View>
                <Text className="text-lg font-body-bold text-foreground">{reviewTarget.name}</Text>
                <Text className="text-sm text-muted-foreground mt-1">How was your experience?</Text>
              </View>

              {/* Star rating */}
              <View className="items-center mb-6">
                <StarRating rating={reviewRating} onRate={setReviewRating} />
                <Text className="text-sm text-muted-foreground mt-2">
                  {reviewRating === 0 ? 'Tap to rate' :
                   reviewRating === 1 ? 'Poor' :
                   reviewRating === 2 ? 'Fair' :
                   reviewRating === 3 ? 'Good' :
                   reviewRating === 4 ? 'Great' : 'Amazing!'}
                </Text>
              </View>

              {/* Tags */}
              <Text className="text-sm font-body-bold text-foreground mb-2">Quick tags</Text>
              <View className="flex-row flex-wrap mb-4">
                {REVIEW_TAGS.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    className={`mr-2 mb-2 px-3 py-1.5 rounded-full ${
                      reviewTags.includes(tag) ? 'bg-primary' : 'bg-card border border-border'
                    }`}
                  >
                    <Text className={`text-sm ${reviewTags.includes(tag) ? 'text-white' : 'text-foreground'}`}>
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Text review */}
              <Text className="text-sm font-body-bold text-foreground mb-2">Comment (optional)</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-6"
                placeholder="Share your experience..."
                placeholderTextColor="#999"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Submit */}
              <Pressable
                onPress={handleSubmitReview}
                disabled={reviewRating === 0 || createReview.isPending}
                className={`rounded-xl py-4 items-center mb-8 ${reviewRating === 0 ? 'bg-muted' : 'bg-primary'}`}
              >
                {createReview.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className={`font-body-bold ${reviewRating === 0 ? 'text-muted-foreground' : 'text-white'}`}>
                    Submit Review
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
