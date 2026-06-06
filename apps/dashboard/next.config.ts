import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:3010";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
