"use client";

import useSWR from "swr";

interface DohResponse {
  Answer?: Array<{ data: string }>;
}

/**
 * Cloudflare's API never tells us whether the customer actually added the
 * routing CNAME — "active" only covers ownership + certificate. This is a
 * live, client-side DNS-over-HTTPS check (Cloudflare's own public resolver,
 * no backend involvement) so the dashboard can show real routing status
 * instead of just assuming it's fine.
 */
async function checkDnsResolves(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      { headers: { Accept: "application/dns-json" } },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as DohResponse;
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return false;
  }
}

export function useDnsResolves(domain: string, enabled: boolean) {
  const { data, isLoading } = useSWR(
    enabled ? `dns-resolves-${domain}` : null,
    () => checkDnsResolves(domain),
    { refreshInterval: 5000 },
  );

  return { resolves: data ?? false, checking: enabled && isLoading };
}
