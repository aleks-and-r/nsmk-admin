import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
// Strip trailing slash for use as rewrite destination base
const apiBase = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
