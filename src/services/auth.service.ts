import axios from "axios";

// Plain axios — NOT apiClient, so our interceptors don't interfere with auth calls
const authAxios = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/", timeout: 10000 });

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

interface RefreshResponse {
  access: string;
}

export async function loginApi(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await authAxios.post<LoginResponse>("auth/login/", {
    username,
    password,
  });
  return data;
}

export async function refreshTokenApi(
  refresh: string,
): Promise<RefreshResponse> {
  const { data } = await authAxios.post<RefreshResponse>("auth/refresh/", {
    refresh,
  });
  return data;
}

export async function getMeApi(): Promise<UserProfile> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { data } = await authAxios.get<UserProfile>("users/me/", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
}
