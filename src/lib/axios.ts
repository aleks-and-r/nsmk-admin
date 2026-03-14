import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const apiClient = axios.create({
  // Trailing slash is required so relative paths (e.g. 'players') resolve correctly
  // under the /api prefix.  Without it, axios would strip the last segment.
  baseURL: BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    // Required to skip ngrok's browser-warning interstitial page
    // 'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === "development") {
      // console.warn avoids Next.js DevTools treating this as an error overlay
      console.warn(
        "[API Error]",
        error.response?.status ?? "Network Error",
        error.config?.url,
        error.message,
        error.response?.data ?? "",
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;
