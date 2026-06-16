/** Public dashboard origin for redirects (behind nginx/Cloudflare). */
export function dashboardUrl(path: string): URL {
  const base = process.env.DASHBOARD_URL ?? "http://localhost:3000";
  return new URL(path, base);
}

/** Loopback API base for dashboard server routes and Next.js rewrites. */
export function apiInternalBaseUrl(): string {
  return (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3010").replace(
    /\/$/,
    "",
  );
}

export function apiInternalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiInternalBaseUrl()}${normalized}`;
}
