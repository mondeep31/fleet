import { Domain } from "@fleet/db";
import { refreshCloudflareStatus, syncActiveDomainRouting } from "@fleet/domains";

/**
 * Periodic sweep: check Cloudflare's status for every pending Domain, then
 * rewrite Traefik's custom-domain routing to match whatever ended up active.
 * Ownership-agnostic — this runs for all users, not scoped to one project.
 */
export async function handleDomainVerifySweep(): Promise<void> {
  const pendingDomains = await Domain.find({ status: "pending" });

  for (const domain of pendingDomains) {
    try {
      await refreshCloudflareStatus(domain);
    } catch (error) {
      console.error(`domain-verify: failed to refresh ${domain.domain}:`, error);
    }
  }

  await syncActiveDomainRouting();
}
