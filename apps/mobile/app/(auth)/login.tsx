import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <Text className="text-4xl font-display text-primary text-center mb-2">
          Spontaneous
        </Text>
        <Text className="text-lg text-muted-foreground text-center mb-10">
          Discover activities around you
        </Text>

        {error ? (
          <View className="bg-destructive/10 p-3 rounded-xl mb-4">
            <Text className="text-destructive text-center">{error}</Text>
          </View>
        ) : null}

        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-3"
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-6"
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="bg-primary rounded-xl py-4 items-center mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-body-bold text-base">Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/signup')} className="py-2">
          <Text className="text-muted-foreground text-center">
            Don't have an account?{' '}
            <Text className="text-primary font-body-bold">Sign Up</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
