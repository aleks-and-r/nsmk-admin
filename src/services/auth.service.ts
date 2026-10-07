import axios from "axios";

// Plain axios — NOT apiClient, so our interceptors don't interfere with auth calls.
// Tokens live in httpOnly cookies set by the API; withCredentials makes the browser send them.
const authAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api/",
  timeout: 60000,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function loginApi(
  username: string,
  password: string,
): Promise<UserProfile> {
  const { data } = await authAxios.post<UserProfile>("auth/login/", {
    username,
    password,
  });
  return data;
}

export async function refreshTokenApi(): Promise<void> {
  await authAxios.post("auth/refresh/");
}

export async function logoutApi(): Promise<void> {
  await authAxios.post("auth/logout/");
}

export async function getMeApi(): Promise<UserProfile> {
  const { data } = await authAxios.get<UserProfile>("users/me/");
  return data;
}
