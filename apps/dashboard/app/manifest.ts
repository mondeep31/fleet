import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fleet",
    short_name: "Fleet",
    description:
      "Connect GitHub, pick a repo, and get a stable live URL — with build logs, env vars, push-to-deploy, and zero-downtime rollouts.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1111",
    theme_color: "#0b1111",
    icons: [
      { src: "/images/brand/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/images/brand/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
