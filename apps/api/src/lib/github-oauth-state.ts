import { createRedisConnection } from "@fleet/queue";
import { randomBytes } from "node:crypto";

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes
const keyFor = (nonce: string) => `github:oauth:state:${nonce}`;

/**
 * Generate a CSRF state nonce, store userId in Redis with a 10-minute TTL,
 * and return the nonce to include in the GitHub authorize URL.
 */
export async function createOAuthState(userId: string): Promise<string> {
  const nonce = randomBytes(24).toString("hex");
  const redis = createRedisConnection();
  try {
    await redis.set(keyFor(nonce), userId, "EX", STATE_TTL_SECONDS);
  } finally {
    redis.disconnect();
  }
  return nonce;
}

/**
 * Validate and consume a state nonce. Returns the userId that initiated the
 * flow, or null if the state is unknown / expired.
 *
 * Deletes the key atomically after first read so it can only be used once.
 */
export async function consumeOAuthState(state: string): Promise<string | null> {
  const redis = createRedisConnection();
  try {
    const userId = await redis.getdel(keyFor(state));
    return userId ?? null;
  } finally {
    redis.disconnect();
  }
}
