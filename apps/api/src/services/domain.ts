import { Domain, isDuplicateKeyError } from "@fleet/db";
import { AppError } from "@fleet/errors";
import {
  createCustomHostname,
  deleteCustomHostname,
  refreshCloudflareStatus,
  syncActiveDomainRouting,
} from "@fleet/domains";
import { assertProjectOwnership } from "./project";

function toDomainStatus(status: string): "pending" | "active" | "error" {
  if (status === "active") return "active";
  if (status === "pending" || status === "pending_deployment") return "pending";
  return "error";
}

export async function addCustomDomain(
  projectId: string,
  userId: string,
  domain: string,
) {
  await assertProjectOwnership(projectId, userId);

  const existing = await Domain.findOne({ domain });
  if (existing) {
    throw new AppError(409, "This domain is already connected to a project", "DOMAIN_TAKEN");
  }

  const hostname = await createCustomHostname(domain);

  try {
    return await Domain.create({
      projectId,
      domain,
      cloudflareHostnameId: hostname.id,
      status: toDomainStatus(hostname.status),
      sslStatus: hostname.ssl?.status,
      ownershipVerification:
        hostname.ownership_verification ?? hostname.ownership_verification_http,
      lastCheckedAt: new Date(),
    });
  } catch (error) {
    // Roll back the Cloudflare-side hostname if we couldn't persist locally
    // (e.g. a race on the unique domain index).
    await deleteCustomHostname(hostname.id).catch(() => {});
    if (isDuplicateKeyError(error)) {
      throw new AppError(409, "This domain is already connected to a project", "DOMAIN_TAKEN");
    }
    throw error;
  }
}

export async function listDomainsForProject(projectId: string, userId: string) {
  await assertProjectOwnership(projectId, userId);
  return Domain.find({ projectId }).sort({ createdAt: 1 });
}

async function findProjectDomain(projectId: string, userId: string, domainId: string) {
  await assertProjectOwnership(projectId, userId);
  const domain = await Domain.findOne({ _id: domainId, projectId });
  if (!domain) {
    throw new AppError(404, "Domain not found", "DOMAIN_NOT_FOUND");
  }
  return domain;
}

export async function refreshDomainStatus(
  projectId: string,
  userId: string,
  domainId: string,
) {
  const domain = await findProjectDomain(projectId, userId, domainId);
  const updated = await refreshCloudflareStatus(domain);
  await syncActiveDomainRouting();
  return updated;
}

export async function removeCustomDomain(
  projectId: string,
  userId: string,
  domainId: string,
) {
  const domain = await findProjectDomain(projectId, userId, domainId);
  await deleteCustomHostname(domain.cloudflareHostnameId);
  await Domain.deleteOne({ _id: domain._id });
  await syncActiveDomainRouting();
}
