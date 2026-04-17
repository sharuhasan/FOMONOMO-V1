import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiRequest, setTokens, clearTokens } from '../api/client';
import { queryClient } from '../api/queryClient';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  profile: {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        setUser(null);
        return;
      }
      const res = await apiRequest<User>('/auth/me');
      setUser(res);
    } catch {
      setUser(null);
      await clearTokens();
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login',
      { method: 'POST', body: { email, password } },
    );
    await setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await apiRequest<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/signup',
      { method: 'POST', body: { email, password, fullName } },
    );
    await setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    await clearTokens();
    queryClient.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
