import React from 'react';
import { Pressable, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Compass, MapPin, Plus, MessageCircle, User } from 'lucide-react-native';

function TabBarIcon({ icon: Icon, color, size }: { icon: typeof Compass; color: string; size: number }) {
  return <Icon size={size} color={color} strokeWidth={2} />;
}

function CreateTabButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center -mt-5 w-14 h-14 rounded-full bg-primary"
      style={{
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Plus size={28} color="#fff" strokeWidth={2.5} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(discover)"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <TabBarIcon icon={Compass} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <TabBarIcon icon={MapPin} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="(create)"
        options={{
          title: '',
          tabBarButton: (props) => <CreateTabButton onPress={() => props.onPress?.(undefined as any)} />,
        }}
      />
      <Tabs.Screen
        name="(messages)"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <TabBarIcon icon={MessageCircle} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <TabBarIcon icon={User} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
