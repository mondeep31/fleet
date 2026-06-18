import { describe, expect, test, afterEach } from "vitest";
import {
  DEFAULT_PLAN_LIMITS,
  getPlanComputeLimits,
  loadPlanLimitsFromEnv,
  normalizePlanId,
  resetPlanLimitsCache,
} from "./plans";

afterEach(() => {
  resetPlanLimitsCache();
});

describe("normalizePlanId", () => {
  test("returns valid plan ids unchanged", () => {
    expect(normalizePlanId("free")).toBe("free");
    expect(normalizePlanId("pro")).toBe("pro");
    expect(normalizePlanId("team")).toBe("team");
    expect(normalizePlanId("unlimited")).toBe("unlimited");
  });

  test("falls back to free for unknown or missing values", () => {
    expect(normalizePlanId("enterprise")).toBe("free");
    expect(normalizePlanId(null)).toBe("free");
    expect(normalizePlanId(undefined)).toBe("free");
  });
});

describe("getPlanComputeLimits", () => {
  test("returns higher limits for pro than free", () => {
    const free = getPlanComputeLimits("free");
    const pro = getPlanComputeLimits("pro");

    expect(pro.memoryMb).toBeGreaterThan(free.memoryMb);
    expect(pro.nanoCpus).toBeGreaterThan(free.nanoCpus);
  });

  test("applies JSON overrides when provided", () => {
    resetPlanLimitsCache();
    const override = JSON.stringify({
      free: { memoryMb: 128, nanoCpus: 100_000_000, pidsLimit: 64, tmpfsMb: 16 },
    });

    const limits = getPlanComputeLimits("free", override);
    expect(limits.memoryMb).toBe(128);
    expect(getPlanComputeLimits("pro", override).memoryMb).toBe(
      DEFAULT_PLAN_LIMITS.pro.memoryMb,
    );
  });

  test("unlimited plan has no resource caps", () => {
    const limits = getPlanComputeLimits("unlimited");
    expect(limits.unlimited).toBe(true);
  });
});

describe("loadPlanLimitsFromEnv", () => {
  test("returns defaults when override is empty", () => {
    expect(loadPlanLimitsFromEnv()).toEqual(DEFAULT_PLAN_LIMITS);
  });
});
