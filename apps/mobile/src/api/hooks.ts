import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';

// Types
interface Profile {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  gender: string | null;
  interests: string[];
  societies: string[];
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  profile: Profile | null;
  _count: {
    hostedActivities: number;
    participations: number;
    givenReviews: number;
    receivedReviews: number;
  };
}

interface Activity {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  category: string;
  location: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  maxParticipants: number;
  imageUrl: string | null;
  isActive: boolean;
  genderFilter: string | null;
  createdAt: string;
  host: {
    id: string;
    fullName: string | null;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
  _count: { participants: number };
}

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface Conversation {
  partnerId: string;
  fullName: string | null;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender?: { id: string; fullName: string | null; profile: { displayName: string; avatarUrl: string | null } | null };
  user?: { id: string; fullName: string | null; profile: { displayName: string; avatarUrl: string | null } | null };
}

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  activity: { id: string; title: string; category: string } | null;
}

// Activities
export function useActivities(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return useQuery<Paginated<Activity>>({
    queryKey: ['activities', params],
    queryFn: () => apiRequest(`/activities${query}`),
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => apiRequest<Activity & { participants: any[] }>(`/activities/${id}`),
    enabled: !!id,
  });
}

export function useMyActivityHistory() {
  return useQuery<Activity[]>({
    queryKey: ['activities', 'myHistory'],
    queryFn: () => apiRequest('/activities/my/history'),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiRequest('/activities', { method: 'POST', body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      apiRequest(`/activities/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['activity', id] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// Participants
export function useJoinActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      apiRequest(`/activities/${activityId}/join`, { method: 'POST' }),
    onSuccess: (_, activityId) => {
      qc.invalidateQueries({ queryKey: ['activity', activityId] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function usePendingRequests(activityId: string) {
  return useQuery({
    queryKey: ['pendingRequests', activityId],
    queryFn: () => apiRequest<any[]>(`/activities/${activityId}/requests`),
    enabled: !!activityId,
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, userId }: { activityId: string; userId: string }) =>
      apiRequest(`/activities/${activityId}/approve/${userId}`, { method: 'PATCH' }),
    onSuccess: (_, { activityId }) => {
      qc.invalidateQueries({ queryKey: ['activity', activityId] });
      qc.invalidateQueries({ queryKey: ['pendingRequests', activityId] });
    },
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, userId }: { activityId: string; userId: string }) =>
      apiRequest(`/activities/${activityId}/reject/${userId}`, { method: 'PATCH' }),
    onSuccess: (_, { activityId }) => {
      qc.invalidateQueries({ queryKey: ['pendingRequests', activityId] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, userId }: { activityId: string; userId: string }) =>
      apiRequest(`/activities/${activityId}/remove/${userId}`, { method: 'DELETE' }),
    onSuccess: (_, { activityId }) => {
      qc.invalidateQueries({ queryKey: ['activity', activityId] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useLeaveActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      apiRequest(`/activities/${activityId}/leave`, { method: 'DELETE' }),
    onSuccess: (_, activityId) => {
      qc.invalidateQueries({ queryKey: ['activity', activityId] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      apiRequest(`/activities/${activityId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

// Profile
export function useProfile(userId: string) {
  return useQuery<UserProfile>({
    queryKey: ['profile', userId],
    queryFn: () => apiRequest(`/profiles/${userId}`),
    enabled: !!userId,
  });
}

export function useMyProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile', 'me'],
    queryFn: () => apiRequest('/profiles/me'),
  });
}

// Friends
export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => apiRequest<any[]>('/friends'),
  });
}

export function useIncomingFriendRequests() {
  return useQuery({
    queryKey: ['friendRequests', 'incoming'],
    queryFn: () => apiRequest<any[]>('/friends/requests/incoming'),
  });
}

export function useFriendshipStatus(userId: string) {
  return useQuery<{ status: string; direction?: string }>({
    queryKey: ['friendStatus', userId],
    queryFn: () => apiRequest(`/friends/status/${userId}`),
    enabled: !!userId,
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/friends/request/${userId}`, { method: 'POST' }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['friendStatus', userId] });
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/friends/accept/${userId}`, { method: 'PATCH' }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['friendStatus', userId] });
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useRejectFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/friends/reject/${userId}`, { method: 'PATCH' }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['friendStatus', userId] });
      qc.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useWithdrawFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/friends/request/${userId}`, { method: 'DELETE' }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['friendStatus', userId] });
      qc.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/friends/${userId}`, { method: 'DELETE' }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['friendStatus', userId] });
      qc.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiRequest('/profiles/me', { method: 'PATCH', body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUserStats(userId: string) {
  return useQuery({
    queryKey: ['stats', userId],
    queryFn: () => apiRequest(`/profiles/${userId}/stats`),
    enabled: !!userId,
  });
}

// Conversations & DMs
export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => apiRequest('/dm/conversations'),
  });
}

export function useDmMessages(userId: string) {
  return useQuery<Paginated<Message>>({
    queryKey: ['dm', userId],
    queryFn: () => apiRequest(`/dm/${userId}`),
    enabled: !!userId,
  });
}

export function useSendDm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      apiRequest(`/dm/${userId}`, { method: 'POST', body: { content } }),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['dm', userId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Activity Chat
export function useActivityMessages(activityId: string) {
  return useQuery<Paginated<Message>>({
    queryKey: ['activityMessages', activityId],
    queryFn: () => apiRequest(`/activities/${activityId}/messages`),
    enabled: !!activityId,
  });
}

export function useSendActivityMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, content }: { activityId: string; content: string }) =>
      apiRequest(`/activities/${activityId}/messages`, { method: 'POST', body: { content } }),
    onSuccess: (_, { activityId }) => {
      qc.invalidateQueries({ queryKey: ['activityMessages', activityId] });
    },
  });
}

// Chat Suggestions
export function useActivityChatSuggestions(activityId: string) {
  return useQuery<string[]>({
    queryKey: ['chatSuggestions', activityId],
    queryFn: () => apiRequest(`/activities/${activityId}/chat-suggestions`),
    enabled: !!activityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDmSuggestions(userId: string) {
  return useQuery<string[]>({
    queryKey: ['dmSuggestions', userId],
    queryFn: () => apiRequest(`/dm/suggestions/${userId}`),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Notifications
export function useNotifications() {
  return useQuery<Paginated<Notification> & { unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications'),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// Reviews
export function useUserReviews(userId: string) {
  return useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => apiRequest(`/reviews/user/${userId}`),
    enabled: !!userId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { revieweeId: string; rating: number; text?: string; tags?: string[] }) =>
      apiRequest('/reviews', { method: 'POST', body: data }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['reviews', variables.revieweeId] });
    },
  });
}

// Recommendations
export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: () => apiRequest<{ suggestedCategories: string[]; activities: Activity[] }>('/recommendations'),
  });
}

// Blocks
export function useBlockStatus(userId: string) {
  return useQuery<{ blocked: boolean }>({
    queryKey: ['blockStatus', userId],
    queryFn: () => apiRequest(`/blocks/${userId}/status`),
    enabled: !!userId,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/blocks/${userId}`, { method: 'POST' }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['blockStatus', userId] });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['blockedUsers'] });
      qc.invalidateQueries({ queryKey: ['pendingRequests'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/blocks/${userId}`, { method: 'DELETE' }),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ['blockStatus', userId] });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: () => apiRequest<any[]>('/blocks'),
  });
}

export type { Activity, UserProfile, Conversation, Message, Notification, Paginated, Profile };
