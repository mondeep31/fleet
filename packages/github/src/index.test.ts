import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { encryptSecret, decryptSecret } from "@fleet/secrets";

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(), findOneAndUpdate: vi.fn(), updateOne: vi.fn(),
  fetch: vi.fn(),
}));
const key = randomBytes(32).toString("base64");
vi.mock("@fleet/db", () => ({ Integration: mocks }));
vi.mock("@fleet/config", () => ({ getSharedEnv: () => ({
  FLEET_SECRETS_ENCRYPTION_KEY: key,
  GITHUB_APP_CLIENT_ID: "app-client", GITHUB_APP_CLIENT_SECRET: "app-secret",
}) }));

import { assertGitHubRepositoryAccess, encryptGitHubTokens, getDecryptedGitHubToken, getGitHubConnection } from "./index";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

function integration(overrides = {}) {
  return {
    ...encryptSecret("old-access", key), oauthApp: "app",
    tokenExpiresAt: new Date(Date.now() - 1000),
    refreshToken: encryptSecret("old-refresh", key),
    refreshTokenExpiresAt: new Date(Date.now() + 86400_000),
    ...overrides,
  };
}
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("GitHub token storage and refresh", () => {
  test("encrypts both tokens and records expiration", () => {
    const stored = encryptGitHubTokens({ access_token: "access", refresh_token: "refresh", expires_in: 28800, refresh_token_expires_in: 100000 });
    expect(stored.ciphertext).not.toContain("access");
    expect(decryptSecret(stored, key)).toBe("access");
    expect(decryptSecret(stored.refreshToken!, key)).toBe("refresh");
    expect(stored.tokenExpiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  test("legacy OAuth deployment connections keep working without refresh", async () => {
    mocks.findOne.mockResolvedValue(integration({ oauthApp: "login" }));
    await expect(getDecryptedGitHubToken("u1")).resolves.toBe("old-access");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test("unexpired app tokens do not refresh", async () => {
    mocks.findOne.mockResolvedValue(integration({ tokenExpiresAt: new Date(Date.now() + 3600_000) }));
    await expect(getGitHubConnection("u1")).resolves.toEqual({ token: "old-access", authType: "app" });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test("missing connection fails before making requests", async () => {
    mocks.findOne.mockResolvedValue(null);
    await expect(getDecryptedGitHubToken("u1")).rejects.toMatchObject({ code: "GITHUB_NOT_CONNECTED" });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test("refreshes an expired token and saves encrypted rotated credentials", async () => {
    mocks.findOne.mockResolvedValue(integration());
    mocks.findOneAndUpdate.mockResolvedValue({});
    mocks.fetch.mockResolvedValue(response({ access_token: "new-access", refresh_token: "new-refresh", expires_in: 28800, refresh_token_expires_in: 100000 }));
    await expect(getDecryptedGitHubToken("u1")).resolves.toBe("new-access");
    expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body)).toMatchObject({ grant_type: "refresh_token", refresh_token: "old-refresh" });
    const saved = mocks.findOneAndUpdate.mock.calls[1]![1].$set;
    expect(decryptSecret(saved, key)).toBe("new-access");
    expect(decryptSecret(saved.refreshToken, key)).toBe("new-refresh");
    expect(mocks.updateOne).toHaveBeenCalled();
  });

  test("a concurrent refresh reads the winner's token instead of rotating twice", async () => {
    mocks.findOne.mockResolvedValueOnce(integration()).mockResolvedValueOnce(integration({ ...encryptSecret("winner", key), tokenExpiresAt: new Date(Date.now() + 3600_000) }));
    mocks.findOneAndUpdate.mockResolvedValueOnce(null);
    await expect(getDecryptedGitHubToken("u1")).resolves.toBe("winner");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test("disconnect during refresh cannot resurrect the connection", async () => {
    mocks.findOne.mockResolvedValueOnce(integration()).mockResolvedValueOnce(null);
    mocks.findOneAndUpdate.mockResolvedValueOnce({}).mockResolvedValueOnce(null);
    mocks.fetch.mockResolvedValue(response({ access_token: "new-access", refresh_token: "new-refresh", expires_in: 28800 }));
    await expect(getDecryptedGitHubToken("u1")).rejects.toMatchObject({ code: "GITHUB_NOT_CONNECTED" });
    expect(mocks.findOneAndUpdate.mock.calls[1]![2]).toEqual({ new: true });
  });

  test("expired refresh token asks for reconnect without contacting GitHub", async () => {
    mocks.findOne.mockResolvedValue(integration({ refreshTokenExpiresAt: new Date(0) }));
    await expect(getDecryptedGitHubToken("u1")).rejects.toMatchObject({ code: "GITHUB_RECONNECT_REQUIRED" });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test("a rejected refresh releases its lock and never includes credentials in the error", async () => {
    mocks.findOne.mockResolvedValue(integration());
    mocks.findOneAndUpdate.mockResolvedValueOnce({});
    mocks.fetch.mockResolvedValue(response({ error: "bad_refresh_token" }));
    await expect(getDecryptedGitHubToken("u1")).rejects.toMatchObject({ code: "GITHUB_RECONNECT_REQUIRED" });
    expect(mocks.updateOne).toHaveBeenCalled();
  });
});

describe("repository selection enforcement", () => {
  test("permits selected repositories case-insensitively", async () => {
    mocks.fetch.mockResolvedValueOnce(response({ installations: [{ id: 10 }] }))
      .mockResolvedValueOnce(response({ repositories: [{ full_name: "Acme/App" }] }));
    await expect(assertGitHubRepositoryAccess("token", "acme/app")).resolves.toBeUndefined();
  });

  test("rejects a public or private repository outside the selection", async () => {
    mocks.fetch.mockResolvedValueOnce(response({ installations: [{ id: 10 }] }))
      .mockResolvedValueOnce(response({ repositories: [{ full_name: "acme/selected" }] }));
    await expect(assertGitHubRepositoryAccess("token", "acme/unselected")).rejects.toMatchObject({ code: "GITHUB_REPO_ACCESS_DENIED" });
  });

  test("skips suspended installations", async () => {
    mocks.fetch.mockResolvedValueOnce(response({ installations: [{ id: 10, suspended_at: "2026-01-01" }] }));
    await expect(assertGitHubRepositoryAccess("token", "acme/app")).rejects.toMatchObject({ code: "GITHUB_REPO_ACCESS_DENIED" });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  test("the deployment token helper enforces selection when a repo is supplied", async () => {
    mocks.findOne.mockResolvedValue(integration({ tokenExpiresAt: null }));
    mocks.fetch.mockResolvedValueOnce(response({ installations: [] }));
    await expect(getDecryptedGitHubToken("u1", "acme/app")).rejects.toMatchObject({ code: "GITHUB_REPO_ACCESS_DENIED" });
  });
});
