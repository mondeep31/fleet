import { createHash, randomInt } from "node:crypto";
import { createRedisConnection } from "@fleet/queue";

const OTP_TTL_SECONDS = 15 * 60; // 15 minutes
const COOLDOWN_TTL_SECONDS = 60; // 1 minute between requests
const MAX_ATTEMPTS = 3;

const otpKey = (email: string) => `password-reset:${email}`;
const cooldownKey = (email: string) => `password-reset:cooldown:${email}`;

interface OtpRecord {
  codeHash: string;
  userId: string;
  attempts: number;
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Generate a 6-digit OTP for the given user, storing a hash+attempt counter
 * in Redis with a 15-minute TTL. Returns the plaintext code to be emailed.
 * Overwrites any existing pending code.
 */
export async function createPasswordResetOtp(
  email: string,
  userId: string,
): Promise<string> {
  const code = String(randomInt(100000, 1000000));
  const record: OtpRecord = { codeHash: hashCode(code), userId, attempts: 0 };
  const redis = createRedisConnection();
  try {
    await redis.set(otpKey(email), JSON.stringify(record), "EX", OTP_TTL_SECONDS);
  } finally {
    redis.disconnect();
  }
  return code;
}

/**
 * Returns true if a cooldown key exists for this email (i.e. a request was
 * made within the last 60 seconds).
 */
export async function isPasswordResetOnCooldown(email: string): Promise<boolean> {
  const redis = createRedisConnection();
  try {
    const val = await redis.exists(cooldownKey(email));
    return val === 1;
  } finally {
    redis.disconnect();
  }
}

/**
 * Set the 60-second cooldown key so the user cannot spam the request endpoint.
 */
export async function setPasswordResetCooldown(email: string): Promise<void> {
  const redis = createRedisConnection();
  try {
    await redis.set(cooldownKey(email), "1", "EX", COOLDOWN_TTL_SECONDS);
  } finally {
    redis.disconnect();
  }
}

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "expired" }
  | { ok: false; reason: "invalid"; attemptsLeft: number }
  | { ok: false; reason: "locked" };

/**
 * Verify a submitted OTP code against the stored hash.
 *
 * - Missing key → expired
 * - Wrong code + attempts < MAX_ATTEMPTS → increment and return attemptsLeft
 * - Wrong code + attempts >= MAX_ATTEMPTS → delete key and return locked
 * - Correct code → delete key and return userId
 */
export async function verifyPasswordResetOtp(
  email: string,
  code: string,
): Promise<VerifyResult> {
  const redis = createRedisConnection();
  try {
    const raw = await redis.get(otpKey(email));
    if (!raw) {
      return { ok: false, reason: "expired" };
    }

    const record = JSON.parse(raw) as OtpRecord;

    if (record.codeHash !== hashCode(code)) {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        await redis.del(otpKey(email));
        return { ok: false, reason: "locked" };
      }
      // Persist incremented attempt count, preserve remaining TTL
      const ttl = await redis.ttl(otpKey(email));
      await redis.set(
        otpKey(email),
        JSON.stringify(record),
        "EX",
        ttl > 0 ? ttl : OTP_TTL_SECONDS,
      );
      return { ok: false, reason: "invalid", attemptsLeft: MAX_ATTEMPTS - record.attempts };
    }

    await redis.del(otpKey(email));
    return { ok: true, userId: record.userId };
  } finally {
    redis.disconnect();
  }
}
