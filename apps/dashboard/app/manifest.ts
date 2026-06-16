import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fleet",
    short_name: "Fleet",
    description:
      "Connect GitHub, pick a repo, and get a stable live URL — with build logs, env vars, push-to-deploy, and zero-downtime rollouts.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a18",
    theme_color: "#1a1a18",
    icons: [
      { src: "/sailboat.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/sailboat.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
