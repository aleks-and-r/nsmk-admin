const AUTH_KEY = 'nsmk_auth';
const TOKEN_KEY = 'token';
const REFRESH_KEY = 'nsmk_refresh';

interface AuthState {
  username: string;
}

// ── Auth state (used by AdminLayout guard) ─────────────────────────────────

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
  clearTokens();
}

// ── Token helpers ──────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function storeNewAccessToken(access: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, access);
}
