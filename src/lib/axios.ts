import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearAuthState } from './auth';
import { refreshTokenApi } from '@/services/auth.service';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/',
  timeout: 10000,
  // Send the httpOnly auth cookies with every request.
  withCredentials: true,
  // X-Requested-With is required by the API's CSRF check on non-GET requests.
  // No default Content-Type — Axios sets application/json for objects and
  // multipart/form-data (with boundary) for FormData automatically.
  // A hardcoded 'application/json' default would cause 415 on file uploads.
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// ── Response: handle 401 → refresh → retry ────────────────────────────────

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Shared so parallel 401s trigger a single refresh call.
let refreshing: Promise<void> | null = null;

function redirectToLogin() {
  clearAuthState();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryConfig;

    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;

      try {
        refreshing ??= refreshTokenApi().finally(() => {
          refreshing = null;
        });
        await refreshing;
        return apiClient(config);
      } catch {
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[API Error]',
        error.response?.status ?? 'Network Error',
        error.config?.url,
        error.message,
        error.response?.data ?? '',
      );
    }

    return Promise.reject(error);
  },
);

export default apiClient;
