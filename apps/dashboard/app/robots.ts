import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/projects",
          "/deployments/",
          "/settings",
          "/connections",
          "/api/",
          "/api-proxy/",
          "/webhooks/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", site).toString(),
  };
}
