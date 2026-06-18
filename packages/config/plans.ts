import { z } from "zod";
import type { PlanId } from "@fleet/types";

export interface PlanComputeLimits {
  /** When true, no memory/CPU/pids/tmpfs caps are applied (security opts still apply). */
  unlimited?: boolean;
  memoryMb: number;
  nanoCpus: number;
  pidsLimit: number;
  tmpfsMb: number;
}

const planIdSchema = z.enum(["free", "pro", "team", "unlimited"]);

const boundedPlanLimitsSchema = z.object({
  memoryMb: z.number().int().min(64),
  nanoCpus: z.number().int().min(100_000_000),
  pidsLimit: z.number().int().min(32),
  tmpfsMb: z.number().int().min(16),
});

const planLimitsSchema = z.union([
  z.object({ unlimited: z.literal(true) }),
  boundedPlanLimitsSchema,
]);

const planLimitsOverrideSchema = z.object({
  free: planLimitsSchema.optional(),
  pro: planLimitsSchema.optional(),
  team: planLimitsSchema.optional(),
  unlimited: planLimitsSchema.optional(),
});

/** Default compute limits per plan — override at deploy time via FLEET_PLAN_LIMITS_JSON. */
export const DEFAULT_PLAN_LIMITS: Record<PlanId, PlanComputeLimits> = {
  free: {
    memoryMb: 256,
    nanoCpus: 250_000_000,
    pidsLimit: 128,
    tmpfsMb: 32,
  },
  pro: {
    memoryMb: 1024,
    nanoCpus: 1_000_000_000,
    pidsLimit: 256,
    tmpfsMb: 64,
  },
  team: {
    memoryMb: 4096,
    nanoCpus: 4_000_000_000,
    pidsLimit: 512,
    tmpfsMb: 128,
  },
  unlimited: {
    unlimited: true,
    memoryMb: 0,
    nanoCpus: 0,
    pidsLimit: 0,
    tmpfsMb: 0,
  },
};

let cachedPlanLimits: Record<PlanId, PlanComputeLimits> | null = null;
let cachedJsonOverride: string | undefined;

function parsePlanLimitsOverride(
  json: string,
): Partial<Record<PlanId, PlanComputeLimits>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    console.error("FLEET_PLAN_LIMITS_JSON is not valid JSON — using defaults");
    return {};
  }

  const result = planLimitsOverrideSchema.safeParse(parsed);
  if (!result.success) {
    console.error("FLEET_PLAN_LIMITS_JSON failed validation — using defaults");
    result.error.issues.forEach((issue) => {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    });
    return {};
  }

  const overrides: Partial<Record<PlanId, PlanComputeLimits>> = {};
  for (const plan of planIdSchema.options) {
    const entry = result.data[plan];
    if (!entry) continue;
    if ("unlimited" in entry && entry.unlimited) {
      overrides[plan] = DEFAULT_PLAN_LIMITS.unlimited;
    } else if ("memoryMb" in entry) {
      overrides[plan] = entry;
    }
  }
  return overrides;
}

export function loadPlanLimitsFromEnv(
  jsonOverride?: string,
): Record<PlanId, PlanComputeLimits> {
  const merged = { ...DEFAULT_PLAN_LIMITS };

  if (jsonOverride?.trim()) {
    const overrides = parsePlanLimitsOverride(jsonOverride);
    for (const plan of planIdSchema.options) {
      if (overrides[plan]) {
        merged[plan] = overrides[plan];
      }
    }
  }

  return merged;
}

export function getPlanLimitsRegistry(
  jsonOverride?: string,
): Record<PlanId, PlanComputeLimits> {
  if (!cachedPlanLimits || cachedJsonOverride !== jsonOverride) {
    cachedPlanLimits = loadPlanLimitsFromEnv(jsonOverride);
    cachedJsonOverride = jsonOverride;
  }
  return cachedPlanLimits;
}

export function resetPlanLimitsCache(): void {
  cachedPlanLimits = null;
  cachedJsonOverride = undefined;
}

export function normalizePlanId(plan: string | null | undefined): PlanId {
  const result = planIdSchema.safeParse(plan);
  return result.success ? result.data : "free";
}

export function isUnlimitedPlan(limits: PlanComputeLimits): boolean {
  return limits.unlimited === true;
}

export function getPlanComputeLimits(
  plan: string | null | undefined,
  jsonOverride?: string,
): PlanComputeLimits {
  const planId = normalizePlanId(plan);
  const registry = getPlanLimitsRegistry(jsonOverride);
  return registry[planId];
}
