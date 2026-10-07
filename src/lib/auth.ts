// Tokens are httpOnly cookies managed by the API and are not readable here.
// This only remembers *who* is logged in so the UI can guard routes; the API
// still rejects requests whose cookies are missing or expired.
const AUTH_KEY = 'nsmk_auth';

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
  // Tokens from the previous localStorage-based login.
  localStorage.removeItem('token');
  localStorage.removeItem('nsmk_refresh');
}
