/**
 * Tests for env-var merge semantics in saveProjectVariables.
 *
 * These tests exercise the "skip re-encryption when value is empty and key
 * exists" rule without hitting a real DB.  We mock ProjectVariable and the
 * encryption helpers so the tests stay fast and deterministic.
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockDeleteMany = vi.fn();
const mockFindForExistingKeys = vi.fn();
const mockFindOneAndUpdate = vi.fn();

/**
 * Build a chainable Mongoose-like query stub that resolves to `value` when
 * awaited or when `.lean()` / `.select()` chains are called.
 */
function makeQuery<T>(value: T) {
  const q: Record<string, unknown> = {};
  q["select"] = () => q;
  q["lean"] = () => Promise.resolve(value);
  q["then"] = (resolve: (v: T) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(value).then(resolve, reject);
  return q;
}

vi.mock("@fleet/db", () => ({
  ProjectVariable: {
    deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    find: (...args: unknown[]) => mockFindForExistingKeys(...args),
    findOneAndUpdate: (...args: unknown[]) => mockFindOneAndUpdate(...args),
  },
}));

vi.mock("@fleet/secrets", () => ({
  encryptSecret: (value: string, _key: string) => ({
    ciphertext: `enc:${value}`,
    iv: "iv",
    authTag: "tag",
  }),
  decryptSecret: (payload: { ciphertext: string }, _key: string) =>
    payload.ciphertext.replace(/^enc:/, ""),
}));

vi.mock("@fleet/config", () => ({
  getSharedEnv: () => ({
    FLEET_SECRETS_ENCRYPTION_KEY: "a".repeat(44),
  }),
}));

// ── Subject ────────────────────────────────────────────────────────────────

import { saveProjectVariables } from "./project-variable";

// ── Helpers ────────────────────────────────────────────────────────────────

function setupExistingKeys(keys: string[]) {
  mockFindForExistingKeys.mockReturnValue(makeQuery(keys.map((key) => ({ key }))));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("saveProjectVariables — merge semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteMany.mockResolvedValue({});
    mockFindOneAndUpdate.mockResolvedValue({});
    // Default: no existing keys
    mockFindForExistingKeys.mockReturnValue(makeQuery([]));
  });

  test("non-empty value is always encrypted and upserted", async () => {
    setupExistingKeys([]);

    await saveProjectVariables("p1", [{ key: "DB_URL", value: "postgres://localhost" }]);

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { projectId: "p1", key: "DB_URL" },
      expect.objectContaining({ ciphertext: "enc:postgres://localhost" }),
      expect.anything(),
    );
  });

  test("empty value for an existing key is skipped (preserve ciphertext)", async () => {
    setupExistingKeys(["SECRET_KEY"]);

    await saveProjectVariables("p1", [{ key: "SECRET_KEY", value: "" }]);

    // findOneAndUpdate must not be called for SECRET_KEY
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
  });

  test("empty value for a new key stores empty string", async () => {
    setupExistingKeys([]);

    await saveProjectVariables("p1", [{ key: "NEW_KEY", value: "" }]);

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { projectId: "p1", key: "NEW_KEY" },
      expect.objectContaining({ ciphertext: "enc:" }),
      expect.anything(),
    );
  });

  test("explicit value overwrites an existing key", async () => {
    setupExistingKeys(["API_TOKEN"]);

    await saveProjectVariables("p1", [{ key: "API_TOKEN", value: "new-token" }]);

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { projectId: "p1", key: "API_TOKEN" },
      expect.objectContaining({ ciphertext: "enc:new-token" }),
      expect.anything(),
    );
  });

  test("keys absent from the input list are deleted", async () => {
    setupExistingKeys(["OLD_KEY", "KEEP_KEY"]);

    await saveProjectVariables("p1", [{ key: "KEEP_KEY", value: "v" }]);

    expect(mockDeleteMany).toHaveBeenCalledWith({
      projectId: "p1",
      key: { $nin: ["KEEP_KEY"] },
    });
  });

  test("mixed list: preserves unchanged, upserts changed, deletes absent", async () => {
    setupExistingKeys(["UNCHANGED", "CHANGED", "TO_DELETE"]);

    await saveProjectVariables("p1", [
      { key: "UNCHANGED", value: "" },   // preserve
      { key: "CHANGED", value: "new" },  // overwrite
      { key: "BRAND_NEW", value: "x" },  // create
      // TO_DELETE omitted → will be deleted
    ]);

    // Deletion covers TO_DELETE
    expect(mockDeleteMany).toHaveBeenCalledWith({
      projectId: "p1",
      key: { $nin: ["UNCHANGED", "CHANGED", "BRAND_NEW"] },
    });

    // Only CHANGED and BRAND_NEW are upserted
    const calls = mockFindOneAndUpdate.mock.calls.map((c) => (c[0] as { key: string }).key);
    expect(calls).not.toContain("UNCHANGED");
    expect(calls).toContain("CHANGED");
    expect(calls).toContain("BRAND_NEW");
  });
});
