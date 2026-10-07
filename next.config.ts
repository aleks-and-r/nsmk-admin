import type { NextConfig } from "next";

// Where the Express API lives. Server-only: the browser always calls this app's
// own /api and /media paths, so auth cookies stay first-party (no CORS, no
// third-party cookie blocking) whether the API is local or on another host.
const API_ORIGIN = (process.env.API_ORIGIN ?? "http://localhost:3001").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // The API uses DRF-style trailing slashes; don't let Next 308-redirect them away.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
      { source: "/media/:path*", destination: `${API_ORIGIN}/media/:path*` },
    ];
  },
};

export default nextConfig;
