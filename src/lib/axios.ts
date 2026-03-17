import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearAuthState, getRefreshToken, storeNewAccessToken } from './auth';
import { refreshTokenApi } from '@/services/auth.service';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request: inject access token ───────────────────────────────────────────

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response: handle 401 → refresh → retry ────────────────────────────────

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryConfig;

    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;

      const refresh = getRefreshToken();
      if (!refresh) {
        clearAuthState();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { access } = await refreshTokenApi(refresh);
        storeNewAccessToken(access);
        config.headers.Authorization = `Bearer ${access}`;
        return apiClient(config);
      } catch {
        clearAuthState();
        if (typeof window !== 'undefined') window.location.href = '/login';
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
