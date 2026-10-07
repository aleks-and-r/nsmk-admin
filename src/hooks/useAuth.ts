'use client';

import { useState, useEffect } from 'react';
import { getAuthState, setAuthState, clearAuthState } from '@/lib/auth';
import { loginApi, logoutApi } from '@/services/auth.service';

interface AuthUser {
  username: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: AuthUser | null;
  mounted: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getAuthState());
    setMounted(true);
  }, []);

  async function login(username: string, password: string): Promise<void> {
    // The API sets the auth cookies on the response.
    const me = await loginApi(username, password);
    setAuthState(me.username);
    setUser({ username: me.username });
  }

  async function logout(): Promise<void> {
    try {
      // Only the server can clear httpOnly cookies.
      await logoutApi();
    } finally {
      clearAuthState();
      setUser(null);
    }
  }

  return {
    isAuthenticated: mounted && user !== null,
    user,
    mounted,
    login,
    logout,
  };
}
