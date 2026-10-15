import { createRedisConnection } from "@fleet/queue";
import { randomBytes } from "node:crypto";

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes
const keyFor = (nonce: string) => `github:oauth:state:${nonce}`;
const loginKeyFor = (nonce: string) => `github:login:state:${nonce}`;
const installKeyFor = (nonce: string) => `github:install:state:${nonce}`;

export type GitHubReturnTo = "/connections" | "/projects/new";
export interface GitHubOAuthContext { userId: string; returnTo?: GitHubReturnTo; installIfMissing?: boolean }

export function normalizeGitHubReturnTo(value: unknown): GitHubReturnTo {
  return value === "/projects/new" ? value : "/connections";
}

function decodeContext(value: string | null): GitHubOAuthContext | null {
  if (!value) return null;
  // States issued before return paths were supported contained just the user ID.
  if (!value.startsWith("{")) return { userId: value };
  try {
    const context = JSON.parse(value);
    if (typeof context.userId !== "string" || !context.userId) return null;
    return {
      userId: context.userId,
      returnTo: normalizeGitHubReturnTo(context.returnTo),
      ...(context.installIfMissing === true ? { installIfMissing: true } : {}),
    };
  } catch { return null; }
}

export async function createInstallationState(userId: string, returnTo?: GitHubReturnTo): Promise<string> {
  const nonce = randomBytes(24).toString("hex");
  const redis = createRedisConnection();
  try {
    await redis.set(installKeyFor(nonce), JSON.stringify({ userId, returnTo }), "EX", STATE_TTL_SECONDS);
  } finally {
    redis.disconnect();
  }
  return nonce;
}

export async function consumeInstallationState(state: string): Promise<GitHubOAuthContext | null> {
  const redis = createRedisConnection();
  try {
    return decodeContext(await redis.getdel(installKeyFor(state)));
  } finally {
    redis.disconnect();
  }
}

/**
 * Generate a CSRF state nonce, store userId in Redis with a 10-minute TTL,
 * and return the nonce to include in the GitHub authorize URL.
 */
export async function createOAuthState(userId: string, returnTo?: GitHubReturnTo, installIfMissing = false): Promise<string> {
  const nonce = randomBytes(24).toString("hex");
  const redis = createRedisConnection();
  try {
    await redis.set(keyFor(nonce), JSON.stringify({ userId, returnTo, ...(installIfMissing ? { installIfMissing: true } : {}) }), "EX", STATE_TTL_SECONDS);
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
export async function consumeOAuthState(state: string): Promise<GitHubOAuthContext | null> {
  const redis = createRedisConnection();
  try {
    return decodeContext(await redis.getdel(keyFor(state)));
  } finally {
    redis.disconnect();
  }
}

/**
 * Generate a CSRF state nonce for the login OAuth flow and store it in Redis
 * with a 10-minute TTL. No userId is associated — this is purely for CSRF
 * protection.
 */
export async function createLoginOAuthState(): Promise<string> {
  const nonce = randomBytes(24).toString("hex");
  const redis = createRedisConnection();
  try {
    await redis.set(loginKeyFor(nonce), "1", "EX", STATE_TTL_SECONDS);
  } finally {
    redis.disconnect();
  }
  return nonce;
}

/**
 * Validate and consume a login state nonce. Returns true if valid,
 * false if unknown or expired.
 *
 * Deletes the key atomically after first read so it can only be used once.
 */
export async function consumeLoginOAuthState(state: string): Promise<boolean> {
  const redis = createRedisConnection();
  try {
    const value = await redis.getdel(loginKeyFor(state));
    return value !== null;
  } finally {
    redis.disconnect();
  }
}
