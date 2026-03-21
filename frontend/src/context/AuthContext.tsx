import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  onboarding_status: string;
  onboarding_step: number;
  first_name?: string;
  last_name?: string;
  goals_text?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Check for existing session on mount - only once
  const checkAuth = useCallback(async () => {
    if (initialized) return;
    
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (!token) {
        setLoading(false);
        setInitialized(true);
        return;
      }
      setSessionToken(token);
      
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        await AsyncStorage.removeItem('session_token');
        setSessionToken(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (url: string) => {
    try {
      const sessionId = url.split('session_id=')[1]?.split('&')[0]?.split('#')[0];
      if (!sessionId) return;
      
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Extract token from cookie or response
        const cookies = response.headers.get('set-cookie');
        let token = '';
        if (cookies) {
          const tokenMatch = cookies.match(/session_token=([^;]+)/);
          if (tokenMatch) token = tokenMatch[1];
        }
        // For mobile, we need to get it differently
        if (!token && userData.session_token) {
          token = userData.session_token;
        }
        // Try to extract from response directly if available
        if (!token) {
          // Make a separate call to get the token
          const meResponse = await fetch(`${API_URL}/api/auth/me`, {
            credentials: 'include',
          });
          if (meResponse.ok) {
            token = sessionId; // Use session_id as fallback
          }
        }
        
        if (token || sessionId) {
          await AsyncStorage.setItem('session_token', token || sessionId);
          setSessionToken(token || sessionId);
        }
        setUser(userData);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
    }
  }, []);

  // Listen for deep links
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('session_id=')) {
        handleOAuthCallback(url);
      }
    });

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('session_id=')) {
        handleOAuthCallback(url);
      }
    });

    return () => subscription.remove();
  }, [handleOAuthCallback]);

  const signIn = async () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = Platform.OS === 'web' 
      ? window.location.origin + '/auth/callback'
      : Linking.createURL('/auth/callback');
    
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    
    if (Platform.OS === 'web') {
      window.location.href = authUrl;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === 'success' && result.url) {
        await handleOAuthCallback(result.url);
      }
    }
  };

  const signOut = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {},
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    await AsyncStorage.removeItem('session_token');
    setSessionToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!sessionToken) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!sessionToken) return;
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser, updateUser, sessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
