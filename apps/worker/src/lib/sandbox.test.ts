import { describe, expect, test } from "vitest";
import type { PlanComputeLimits } from "@fleet/config";
import { buildSandboxHostConfig } from "./sandbox";

const proLimits: PlanComputeLimits = {
  memoryMb: 1024,
  nanoCpus: 2_000_000_000,
  pidsLimit: 128,
  tmpfsMb: 32,
};

const unlimitedLimits: PlanComputeLimits = {
  unlimited: true,
  memoryMb: 0,
  nanoCpus: 0,
  pidsLimit: 0,
  tmpfsMb: 0,
};

describe("buildSandboxHostConfig", () => {
  test("drops all capabilities and blocks privilege escalation", () => {
    const config = buildSandboxHostConfig(proLimits);

    expect(config.CapDrop).toEqual(["ALL"]);
    expect(config.SecurityOpt).toEqual(["no-new-privileges:true"]);
  });

  test("applies plan compute limits to Docker host config", () => {
    const config = buildSandboxHostConfig(proLimits);

    expect(config.Memory).toBe(1024 * 1024 * 1024);
    expect(config.NanoCpus).toBe(2_000_000_000);
    expect(config.PidsLimit).toBe(128);
    expect(config.Tmpfs).toEqual({ "/tmp": "size=32m" });
  });

  test("omits resource caps for unlimited plan", () => {
    const config = buildSandboxHostConfig(unlimitedLimits);

    expect(config.CapDrop).toEqual(["ALL"]);
    expect(config.Memory).toBeUndefined();
    expect(config.NanoCpus).toBeUndefined();
    expect(config.PidsLimit).toBeUndefined();
    expect(config.Tmpfs).toBeUndefined();
  });
});
