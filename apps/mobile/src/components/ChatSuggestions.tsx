import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface ChatSuggestionsProps {
  suggestions: string[] | undefined;
  isLoading: boolean;
  onSelect: (text: string) => void;
  onRefresh?: () => void;
}

export default function ChatSuggestions({ suggestions, isLoading, onSelect, onRefresh }: ChatSuggestionsProps) {
  if (isLoading) {
    return (
      <View className="flex-row items-center px-4 py-2">
        <ActivityIndicator size="small" color="#FF6B6B" />
        <Text className="text-xs text-muted-foreground ml-2">Getting suggestions...</Text>
      </View>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <View className="border-t border-border bg-background">
      <View className="flex-row items-center px-4 pt-2 pb-1">
        <Sparkles size={12} color="#FF6B6B" />
        <Text className="text-[11px] text-muted-foreground ml-1 flex-1">Suggestions</Text>
        {onRefresh && (
          <Pressable onPress={onRefresh}>
            <Text className="text-[11px] text-primary">Refresh</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
      >
        {suggestions.map((text, i) => (
          <Pressable
            key={`${text}-${i}`}
            onPress={() => onSelect(text)}
            className="bg-primary/10 border border-primary/20 rounded-full px-3.5 py-1.5 mr-2"
          >
            <Text className="text-primary text-sm">{text}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
