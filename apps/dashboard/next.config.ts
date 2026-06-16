import type { NextConfig } from "next";

const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3010";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${API_INTERNAL_URL}/:path*`,
      },
      // GitHub delivers push webhooks to {API_URL}/webhooks/github. When API_URL
      // is the dashboard host, proxy webhook traffic to the API process.
      {
        source: "/webhooks/:path*",
        destination: `${API_INTERNAL_URL}/webhooks/:path*`,
      },
    ];
  },
};

export default nextConfig;
