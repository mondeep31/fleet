import { User } from "@fleet/db";
import {
  getPlanComputeLimits,
  getSharedEnv,
  type PlanComputeLimits,
} from "@fleet/config";

export async function getComputeLimitsForUser(
  userId: string,
): Promise<PlanComputeLimits> {
  const user = await User.findOne({ userId }).select("plan").lean();
  const env = getSharedEnv();
  return getPlanComputeLimits(user?.plan, env.FLEET_PLAN_LIMITS_JSON);
}
