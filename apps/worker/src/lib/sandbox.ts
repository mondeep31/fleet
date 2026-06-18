import type Docker from "dockerode";
import { isUnlimitedPlan, type PlanComputeLimits } from "@fleet/config";

/**
 * Runtime isolation for user-deployed containers.
 * Caps, no-new-privileges, and resource limits reduce cross-tenant abuse
 * and container escape surface on a shared Docker host.
 */
export function buildSandboxHostConfig(
  limits: PlanComputeLimits,
): NonNullable<Docker.ContainerCreateOptions["HostConfig"]> {
  const base: NonNullable<Docker.ContainerCreateOptions["HostConfig"]> = {
    CapDrop: ["ALL"],
    SecurityOpt: ["no-new-privileges:true"],
  };

  if (isUnlimitedPlan(limits)) {
    return base;
  }

  return {
    ...base,
    Memory: limits.memoryMb * 1024 * 1024,
    NanoCpus: limits.nanoCpus,
    PidsLimit: limits.pidsLimit,
    Tmpfs: {
      "/tmp": `size=${limits.tmpfsMb}m`,
    },
  };
}
