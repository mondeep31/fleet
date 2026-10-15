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
      // Public GitHub return URLs also work when the dashboard is the public API origin.
      {
        source: "/api/v1/integrations/github/setup",
        destination: `${API_INTERNAL_URL}/api/v1/integrations/github/setup`,
      },
      {
        source: "/api/v1/integrations/github/callback",
        destination: `${API_INTERNAL_URL}/api/v1/integrations/github/callback`,
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
