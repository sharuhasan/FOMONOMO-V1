import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useDmMessages, useSendDm, useProfile, useDmSuggestions } from '../../../../src/api/hooks';
import ChatSuggestions from '../../../../src/components/ChatSuggestions';
import Avatar from '../../../../src/components/Avatar';

export default function DmChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: partner } = useProfile(userId!);
  const { data: messagesData, refetch } = useDmMessages(userId!);
  const sendDm = useSendDm();
  const { data: suggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useDmSuggestions(userId!);

  const partnerName = partner?.profile?.displayName || partner?.fullName || 'User';

  // Auto-refresh messages
  useEffect(() => {
    const interval = setInterval(refetch, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const text = message.trim();
    setMessage('');
    await sendDm.mutateAsync({ userId: userId!, content: text });
    refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <View className="mr-2">
          <Avatar url={partner?.profile?.avatarUrl} name={partnerName} size={32} />
        </View>
        <Text className="text-lg font-body-bold text-foreground">{partnerName}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messagesData?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">Start a conversation</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender?.id === user?.id;
            return (
              <View className={`mb-2 ${isMe ? 'items-end' : 'items-start'}`}>
                <View className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
                  isMe ? 'bg-primary rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'
                }`}>
                  <Text className={isMe ? 'text-white' : 'text-foreground'}>{item.content}</Text>
                </View>
                <Text className="text-[10px] text-muted-foreground mt-0.5 px-1">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />

        <ChatSuggestions
          suggestions={suggestions}
          isLoading={suggestionsLoading}
          onSelect={(text) => { setMessage(text); }}
          onRefresh={() => refetchSuggestions()}
        />
        <View className="flex-row items-center px-4 py-2 border-t border-border bg-background">
          <TextInput
            className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-foreground mr-2"
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            disabled={!message.trim()}
            className="bg-primary w-10 h-10 rounded-full items-center justify-center"
          >
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
