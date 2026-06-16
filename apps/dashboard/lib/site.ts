/** Canonical public origin, driven by DASHBOARD_URL (set at build/runtime). */
export function getSiteUrl(): URL {
  return new URL(process.env.DASHBOARD_URL ?? "http://localhost:3000");
}
