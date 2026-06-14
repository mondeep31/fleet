import { describe, test, expect } from "vitest";
import { encryptSecret, decryptSecret } from "./index";
import { randomBytes } from "node:crypto";

function makeKey(): string {
  return randomBytes(32).toString("base64");
}

describe("secrets", () => {
  test("round-trips plaintext correctly", () => {
    const key = makeKey();
    const plaintext = "super-secret-value-123";
    const payload = encryptSecret(plaintext, key);
    expect(decryptSecret(payload, key)).toBe(plaintext);
  });

  test("ciphertext is not plaintext", () => {
    const key = makeKey();
    const plaintext = "my_database_url";
    const { ciphertext } = encryptSecret(plaintext, key);
    expect(Buffer.from(ciphertext, "base64").toString()).not.toContain(plaintext);
  });

  test("each call produces a unique ciphertext (random IV)", () => {
    const key = makeKey();
    const plaintext = "same-value";
    const a = encryptSecret(plaintext, key);
    const b = encryptSecret(plaintext, key);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  test("throws when decrypting with wrong key", () => {
    const key = makeKey();
    const wrongKey = makeKey();
    const payload = encryptSecret("secret", key);
    expect(() => decryptSecret(payload, wrongKey)).toThrow();
  });

  test("throws when auth tag is tampered", () => {
    const key = makeKey();
    const payload = encryptSecret("secret", key);
    const tampered = { ...payload, authTag: makeKey().slice(0, payload.authTag.length) };
    expect(() => decryptSecret(tampered, key)).toThrow();
  });

  test("throws when key is wrong length", () => {
    const shortKey = randomBytes(16).toString("base64");
    expect(() => encryptSecret("value", shortKey)).toThrow("32 bytes");
  });
});
