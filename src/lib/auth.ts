const AUTH_KEY = 'nsmk_auth';

interface AuthState {
  username: string;
}

export function getAuthState(): AuthState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function setAuthState(username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ username }));
}

export function clearAuthState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

export function validateCredentials(username: string, password: string): boolean {
  return username === 'admin123' && password === 'admin123';
}
