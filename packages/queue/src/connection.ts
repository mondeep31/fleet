import { getSharedEnv } from "@fleet/config";
import IORedis from "ioredis";

export function createRedisConnection() {
  const { REDIS_URL } = getSharedEnv();
  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}
