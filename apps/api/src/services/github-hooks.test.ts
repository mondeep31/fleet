import { describe, test, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockListRepoHooks = vi.fn();
const mockCreateRepoHook = vi.fn();
const mockDeleteRepoHook = vi.fn();
const mockGetDecryptedGitHubToken = vi.fn().mockResolvedValue("token-abc");
const mockProjectFind = vi.fn();
const mockIntegrationFindOne = vi.fn().mockResolvedValue(null);

vi.mock("@fleet/db", () => ({
  Project: { find: (...args: unknown[]) => mockProjectFind(...args) },
  Integration: { findOne: (...args: unknown[]) => mockIntegrationFindOne(...args) },
}));

vi.mock("@fleet/config", () => ({
  getEnv: () => ({
    API_URL: "https://api.example.com",
    GITHUB_WEBHOOK_SECRET: "s3cr3t",
  }),
}));

vi.mock("@fleet/errors", () => ({
  AppError: class extends Error {
    constructor(
      public status: number,
      message: string,
      public code: string,
    ) {
      super(message);
    }
  },
}));

vi.mock("../lib/github-client", () => ({
  listRepoHooks: (...args: unknown[]) => mockListRepoHooks(...args),
  createRepoHook: (...args: unknown[]) => mockCreateRepoHook(...args),
  deleteRepoHook: (...args: unknown[]) => mockDeleteRepoHook(...args),
}));

vi.mock("./github-integration", () => ({
  getDecryptedGitHubToken: (...args: unknown[]) => mockGetDecryptedGitHubToken(...args),
}));

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

import { ensureRepoWebhook, removeRepoWebhookIfUnused } from "./github-hooks";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ensureRepoWebhook", () => {
  beforeEach(() => vi.clearAllMocks());

  test("GitHub App connections use the app webhook without managing repository hooks", async () => {
    mockIntegrationFindOne.mockResolvedValueOnce({ oauthApp: "app" });
    await expect(ensureRepoWebhook("user-1", "acme", "app")).resolves.toBeUndefined();
    expect(mockListRepoHooks).not.toHaveBeenCalled();
    expect(mockCreateRepoHook).not.toHaveBeenCalled();
  });

  test("returns existing hook id when hook already registered", async () => {
    mockListRepoHooks.mockResolvedValue([
      { id: 42, config: { url: "https://api.example.com/webhooks/github" }, active: true, events: ["push"] },
    ]);

    const id = await ensureRepoWebhook("user-1", "acme", "app");
    expect(id).toBe(42);
    expect(mockCreateRepoHook).not.toHaveBeenCalled();
  });

  test("creates a new hook when none exists", async () => {
    mockListRepoHooks.mockResolvedValue([]);
    mockCreateRepoHook.mockResolvedValue({ id: 99 });

    const id = await ensureRepoWebhook("user-1", "acme", "app");
    expect(id).toBe(99);
    expect(mockCreateRepoHook).toHaveBeenCalledWith(
      "token-abc",
      "acme",
      "app",
      "https://api.example.com/webhooks/github",
      "s3cr3t",
    );
  });

  test("throws AppError when listRepoHooks returns 403", async () => {
    mockListRepoHooks.mockRejectedValue(new Error("returned 403: Forbidden"));
    await expect(ensureRepoWebhook("user-1", "acme", "app")).rejects.toMatchObject({
      code: "GITHUB_HOOK_FAILED",
    });
  });

  test("throws AppError when createRepoHook returns 403", async () => {
    mockListRepoHooks.mockResolvedValue([]);
    mockCreateRepoHook.mockRejectedValue(new Error("returned 403: Forbidden"));
    await expect(ensureRepoWebhook("user-1", "acme", "app")).rejects.toMatchObject({
      code: "GITHUB_HOOK_FAILED",
    });
  });
});

describe("removeRepoWebhookIfUnused", () => {
  beforeEach(() => vi.clearAllMocks());

  test("does nothing when hookId is undefined", async () => {
    await removeRepoWebhookIfUnused("user-1", "proj-1", "https://github.com/acme/app", undefined);
    expect(mockProjectFind).not.toHaveBeenCalled();
  });

  test("does nothing when another active project uses the same repo", async () => {
    mockProjectFind.mockResolvedValue([{ projectId: "proj-2" }]);
    await removeRepoWebhookIfUnused("user-1", "proj-1", "https://github.com/acme/app", 42);
    expect(mockDeleteRepoHook).not.toHaveBeenCalled();
  });

  test("deletes hook when no other project uses the repo", async () => {
    mockProjectFind.mockResolvedValue([]);
    await removeRepoWebhookIfUnused("user-1", "proj-1", "https://github.com/acme/app", 42);
    expect(mockDeleteRepoHook).toHaveBeenCalledWith("token-abc", "acme", "app", 42);
  });

  test("does not throw when deleteRepoHook fails (best-effort)", async () => {
    mockProjectFind.mockResolvedValue([]);
    mockDeleteRepoHook.mockRejectedValue(new Error("network error"));
    await expect(
      removeRepoWebhookIfUnused("user-1", "proj-1", "https://github.com/acme/app", 42),
    ).resolves.toBeUndefined();
  });
});
