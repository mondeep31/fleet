import { Domain } from "@fleet/db";

/**
 * Deliberately its own file with only a @fleet/db import (not services/domain.ts,
 * which imports services/project.ts) — services/deployment.ts needs this, and
 * services/project.ts already imports services/deployment.ts, so pulling in
 * services/domain.ts here would create a circular import.
 */

export async function getPrimaryCustomUrl(projectId: string): Promise<string | null> {
  const domain = await Domain.findOne({ projectId, status: "active" }).sort({
    createdAt: 1,
  });
  return domain ? `https://${domain.domain}` : null;
}

export async function getPrimaryCustomUrls(
  projectIds: string[],
): Promise<Map<string, string>> {
  if (projectIds.length === 0) return new Map();

  const domains = await Domain.find({
    projectId: { $in: projectIds },
    status: "active",
  }).sort({ createdAt: 1 });

  const map = new Map<string, string>();
  for (const domain of domains) {
    if (!map.has(domain.projectId)) {
      map.set(domain.projectId, `https://${domain.domain}`);
    }
  }
  return map;
}
