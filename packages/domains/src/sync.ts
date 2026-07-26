import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Domain } from "@fleet/db";
import { getSharedEnv } from "@fleet/config";
import { getCustomHostname } from "./cloudflare-client";

type DomainDoc = NonNullable<Awaited<ReturnType<typeof Domain.findOne>>>;

/**
 * Cloudflare reports hostname activation (ownership) and certificate
 * issuance as two independent statuses — a hostname can be "active" while
 * its cert is still "pending_validation". Only report our own domain as
 * `active` once both are done; otherwise the dashboard would claim a domain
 * is ready when HTTPS doesn't actually work yet.
 */
export function toDomainStatus(
  hostnameStatus: string,
  sslStatus: string | undefined,
): "pending" | "active" | "error" {
  if (hostnameStatus !== "active" && hostnameStatus !== "pending" && hostnameStatus !== "pending_deployment") {
    return "error";
  }
  if (hostnameStatus === "active" && sslStatus === "active") return "active";
  return "pending";
}

/**
 * Ownership-agnostic Cloudflare status refresh — shared by the API's manual
 * "verify now" endpoint and the worker's periodic sweep. Callers are
 * responsible for their own authorization checks before calling this.
 */
export async function refreshCloudflareStatus(domain: DomainDoc): Promise<DomainDoc> {
  const hostname = await getCustomHostname(domain.cloudflareHostnameId);

  domain.status = toDomainStatus(hostname.status, hostname.ssl?.status);
  domain.sslStatus = hostname.ssl?.status;
  domain.ownershipVerification =
    hostname.ownership_verification ?? hostname.ownership_verification_http;
  domain.sslValidationRecords = hostname.ssl?.validation_records ?? [];
  domain.error =
    hostname.verification_errors?.join("; ") ??
    hostname.ssl?.validation_errors?.map((e) => e.message).filter(Boolean).join("; ");
  domain.lastCheckedAt = new Date();
  await domain.save();
  return domain;
}

// Router name scheme must match buildTraefikLabels in apps/worker/src/steps/run.ts
// so the file provider's `service` reference resolves to the docker-discovered service.
function projectServiceRef(projectId: string): string {
  const routerName = `fleet${projectId.replace(/[^a-zA-Z0-9]/g, "")}`;
  return `${routerName}@docker`;
}

function domainRouterName(domainId: string): string {
  return `fleet-domain-${domainId}`;
}

function buildDynamicConfigYaml(domains: DomainDoc[]): string {
  if (domains.length === 0) {
    return "# No active custom domains.\nhttp:\n  routers: {}\n";
  }

  const routers = domains
    .map((domain) => {
      const name = domainRouterName(String(domain._id));
      return [
        `    ${name}:`,
        `      rule: "Host(\`${domain.domain}\`)"`,
        `      entrypoints:`,
        `        - web`,
        `      service: "${projectServiceRef(domain.projectId)}"`,
      ].join("\n");
    })
    .join("\n");

  return `http:\n  routers:\n${routers}\n`;
}

/**
 * Rewrites the Traefik file-provider config from scratch to match all
 * currently-active domains. Idempotent full rewrite rather than incremental
 * patching — simpler to reason about and self-healing if the file is lost.
 */
export async function syncActiveDomainRouting(): Promise<void> {
  const { FLEET_TRAEFIK_DYNAMIC_DIR } = getSharedEnv();
  const activeDomains = await Domain.find({ status: "active" });

  await mkdir(FLEET_TRAEFIK_DYNAMIC_DIR, { recursive: true });

  const finalPath = join(FLEET_TRAEFIK_DYNAMIC_DIR, "custom-domains.yml");
  const tmpPath = `${finalPath}.tmp`;

  await writeFile(tmpPath, buildDynamicConfigYaml(activeDomains), "utf8");
  await rename(tmpPath, finalPath);
}
