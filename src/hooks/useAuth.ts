'use client';

import { useState, useEffect } from 'react';
import { getAuthState, setAuthState, clearAuthState, setTokens } from '@/lib/auth';
import { loginApi } from '@/services/auth.service';

interface AuthUser {
  username: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: AuthUser | null;
  mounted: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getAuthState());
    setMounted(true);
  }, []);

  async function login(username: string, password: string): Promise<void> {
    const { access, refresh } = await loginApi(username, password);
    setTokens(access, refresh);
    setAuthState(username);
    setUser({ username });
  }

  function logout() {
    clearAuthState();
    setUser(null);
  }

  return {
    isAuthenticated: mounted && user !== null,
    user,
    mounted,
    login,
    logout,
  };
}
