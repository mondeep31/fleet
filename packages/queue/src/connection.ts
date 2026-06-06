import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:16379";

export function createRedisConnection() {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}
