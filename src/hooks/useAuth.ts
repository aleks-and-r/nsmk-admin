'use client';

import { useState, useEffect } from 'react';
import { getAuthState, setAuthState, clearAuthState } from '@/lib/auth';

interface AuthUser {
  username: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: AuthUser | null;
  mounted: boolean;
  login: (username: string) => void;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getAuthState());
    setMounted(true);
  }, []);

  function login(username: string) {
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
