import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(), findOneAndUpdate: vi.fn(), deleteOne: vi.fn(),
  createInstallationState: vi.fn(), consumeInstallationState: vi.fn(),
  createOAuthState: vi.fn(), consumeOAuthState: vi.fn(),
  exchangeGitHubAppCode: vi.fn(), getAuthenticatedUser: vi.fn(),
  listUserInstallations: vi.fn(), revokeToken: vi.fn(),
  getAppRepositoryAccess: vi.fn(),
  getGitHubConnection: vi.fn(), encryptGitHubTokens: vi.fn(),
  config: {
    GITHUB_APP_SLUG: "fleet-repos", GITHUB_APP_CLIENT_ID: "app-id",
    GITHUB_APP_CLIENT_SECRET: "app-secret", GITHUB_APP_CALLBACK_URL: "https://api.example.com/callback",
    GITHUB_OAUTH_SUCCESS_REDIRECT: "https://fleet.example.com/projects",
    GITHUB_LOGIN_CLIENT_ID: "login-id", GITHUB_LOGIN_CLIENT_SECRET: "login-secret",
  } as Record<string, string | undefined>,
}));
vi.mock("@fleet/db", () => ({ Integration: mocks }));
vi.mock("@fleet/config", () => ({ getEnv: () => mocks.config, getSharedEnv: () => ({ DASHBOARD_URL: "https://fleet.example.com" }) }));
vi.mock("@fleet/github", () => ({
  getGitHubConnection: mocks.getGitHubConnection,
  encryptGitHubTokens: mocks.encryptGitHubTokens,
  getDecryptedGitHubToken: vi.fn(),
}));
vi.mock("../lib/github-oauth-state", () => mocks);
vi.mock("../lib/github-client", async () => {
  const actual = await vi.importActual<typeof import("../lib/github-client")>("../lib/github-client");
  return { ...actual, exchangeGitHubAppCode: mocks.exchangeGitHubAppCode, getAuthenticatedUser: mocks.getAuthenticatedUser, listUserInstallations: mocks.listUserInstallations, revokeToken: mocks.revokeToken, getAppRepositoryAccess: mocks.getAppRepositoryAccess };
});

import { disconnectGitHub, getConnectRedirectUrl, getInstallationRedirectUrl, getGitHubStatus, handleInstallationSetup, handleOAuthCallback } from "./github-integration";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createInstallationState.mockResolvedValue("install-state");
  mocks.consumeInstallationState.mockResolvedValue({ userId: "user-1" });
  mocks.createOAuthState.mockResolvedValue("oauth-state");
  mocks.consumeOAuthState.mockResolvedValue({ userId: "user-1" });
  mocks.exchangeGitHubAppCode.mockResolvedValue({ access_token: "app-token", refresh_token: "refresh", expires_in: 28800 });
  mocks.getAuthenticatedUser.mockResolvedValue({ id: 42, login: "octocat" });
  mocks.listUserInstallations.mockResolvedValue([{ id: 10, permissions: { contents: "read" }, suspended_at: null }]);
  mocks.encryptGitHubTokens.mockReturnValue({ ciphertext: "encrypted", iv: "iv", authTag: "tag" });
  mocks.getGitHubConnection.mockResolvedValue({ token: "app-token" });
  mocks.getAppRepositoryAccess.mockResolvedValue({ repositorySelection: "selected", repositoryCount: 1, contentsPermission: "read" });
});

describe("GitHub App repository connection", () => {
  test("Connect authorizes first so already-installed Apps do not get stuck in installation settings", async () => {
    const url = new URL(await getConnectRedirectUrl("user-1"));
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("state")).toBe("oauth-state");
    expect(url.searchParams.has("scope")).toBe(false);
    expect(mocks.createOAuthState).toHaveBeenCalledWith("user-1", "/connections", true);
    expect(mocks.createInstallationState).not.toHaveBeenCalled();
  });

  test("managing repositories still opens the installation picker", async () => {
    const url = new URL(await getInstallationRedirectUrl("user-1"));
    expect(url.pathname).toBe("/apps/fleet-repos/installations/new");
    expect(mocks.createInstallationState).toHaveBeenCalledWith("user-1", "/connections");
  });

  test("missing App config fails clearly before starting installation", async () => {
    const slug = mocks.config.GITHUB_APP_SLUG;
    mocks.config.GITHUB_APP_SLUG = undefined;
    try {
      await expect(getConnectRedirectUrl("user-1")).rejects.toMatchObject({ code: "GITHUB_APP_NOT_CONFIGURED" });
      expect(mocks.createInstallationState).not.toHaveBeenCalled();
    } finally { mocks.config.GITHUB_APP_SLUG = slug; }
  });

  test("setup consumes installation state and starts separate user authorization", async () => {
    const url = new URL(await handleInstallationSetup("install-state"));
    expect(mocks.consumeInstallationState).toHaveBeenCalledWith("install-state");
    expect(mocks.createOAuthState).toHaveBeenCalledWith("user-1", "/connections", false);
    expect(url.pathname).toBe("/login/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("app-id");
    expect(url.searchParams.get("state")).toBe("oauth-state");
    expect(url.searchParams.has("scope")).toBe(false);
  });

  test("setup rejects unknown or expired state before user authorization", async () => {
    mocks.consumeInstallationState.mockResolvedValueOnce(null);
    await expect(handleInstallationSetup("bad")).rejects.toMatchObject({ code: "INVALID_OAUTH_STATE" });
    expect(mocks.createOAuthState).not.toHaveBeenCalled();
  });

  test("callback saves only the App grant after verifying the user's installations", async () => {
    await expect(handleOAuthCallback("code", "oauth-state")).resolves.toEqual({ redirectUrl: "https://fleet.example.com/projects", connected: true });
    expect(mocks.exchangeGitHubAppCode).toHaveBeenCalledWith("app-id", "app-secret", "code");
    expect(mocks.listUserInstallations).toHaveBeenCalledWith("app-token");
    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1", provider: "github" },
      expect.objectContaining({ $set: expect.objectContaining({ oauthApp: "app", githubUserId: "42", scopes: [], ciphertext: "encrypted" }) }),
      { upsert: true, new: true },
    );
  });

  test("Connect links an existing GitHub installation even when Fleet has no connection stored", async () => {
    mocks.findOne.mockResolvedValueOnce(null);
    mocks.consumeOAuthState.mockResolvedValueOnce({ userId: "user-1", returnTo: "/connections", installIfMissing: true });
    await expect(handleOAuthCallback("code", "oauth-state")).resolves.toEqual({ redirectUrl: "https://fleet.example.com/connections", connected: true });
    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1", provider: "github" }, expect.anything(), { upsert: true, new: true },
    );
    expect(mocks.createInstallationState).not.toHaveBeenCalled();
  });

  test("a first-time connection opens installation only after GitHub confirms no installation exists", async () => {
    mocks.consumeOAuthState.mockResolvedValueOnce({ userId: "user-1", returnTo: "/projects/new", installIfMissing: true });
    mocks.listUserInstallations.mockResolvedValueOnce([]);
    const result = await handleOAuthCallback("code", "oauth-state");
    expect(result.connected).toBe(false);
    const url = new URL(result.redirectUrl);
    expect(url.pathname).toBe("/apps/fleet-repos/installations/new");
    expect(url.searchParams.get("state")).toBe("install-state");
    expect(mocks.createInstallationState).toHaveBeenCalledWith("user-1", "/projects/new");
    expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("a suspended installation does not create an installation loop", async () => {
    mocks.consumeOAuthState.mockResolvedValueOnce({ userId: "user-1", installIfMissing: true });
    mocks.listUserInstallations.mockResolvedValueOnce([{ id: 10, suspended_at: "2026-01-01", permissions: { contents: "read" } }]);
    await expect(handleOAuthCallback("code", "oauth-state")).rejects.toMatchObject({ code: "GITHUB_INSTALLATION_REQUIRED" });
    expect(mocks.createInstallationState).not.toHaveBeenCalled();
  });

  test("callback rejects invalid state before exchanging credentials", async () => {
    mocks.consumeOAuthState.mockResolvedValueOnce(null);
    await expect(handleOAuthCallback("code", "bad")).rejects.toMatchObject({ code: "INVALID_OAUTH_STATE" });
    expect(mocks.exchangeGitHubAppCode).not.toHaveBeenCalled();
  });

  test.each([
    { installations: [] },
    { installations: [{ id: 10, permissions: { contents: "read" }, suspended_at: "2026-01-01" }] },
    { installations: [{ id: 10, permissions: {}, suspended_at: null }] },
  ])("callback requires an accessible installation with code read permission: %j", async ({ installations }) => {
    mocks.listUserInstallations.mockResolvedValueOnce(installations);
    await expect(handleOAuthCallback("code", "state")).rejects.toMatchObject({ code: "GITHUB_INSTALLATION_REQUIRED" });
    expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("legacy connections are flagged for migration and app connections are fine-grained", async () => {
    mocks.findOne.mockResolvedValueOnce({ oauthApp: "login", githubUsername: "octocat" }).mockResolvedValueOnce({ oauthApp: "app", githubUsername: "octocat" });
    await expect(getGitHubStatus("user-1")).resolves.toMatchObject({ connected: true, fineGrained: false, needsReconnect: true });
    await expect(getGitHubStatus("user-1")).resolves.toEqual({ connected: true, fineGrained: true, username: "octocat", repositorySelection: "selected", repositoryCount: 1, contentsPermission: "read" });
  });

  test("adding repository access returns to the originating project picker", async () => {
    mocks.consumeInstallationState.mockResolvedValueOnce({ userId: "user-1", returnTo: "/projects/new" });
    await handleInstallationSetup("install-state");
    expect(mocks.createOAuthState).toHaveBeenCalledWith("user-1", "/projects/new", false);
    mocks.consumeOAuthState.mockResolvedValueOnce({ userId: "user-1", returnTo: "/projects/new" });
    await expect(handleOAuthCallback("code", "oauth-state")).resolves.toEqual({ redirectUrl: "https://fleet.example.com/projects/new", connected: true });
  });

  test("status refreshes current GitHub access after a repository-selection change", async () => {
    mocks.findOne.mockResolvedValue({ oauthApp: "app", githubUsername: "octocat" });
    mocks.getAppRepositoryAccess.mockResolvedValueOnce({ repositorySelection: "selected", repositoryCount: 2, contentsPermission: "read" });
    await expect(getGitHubStatus("user-1")).resolves.toMatchObject({ connected: true, repositoryCount: 2, repositorySelection: "selected" });
    expect(mocks.getAppRepositoryAccess).toHaveBeenCalledWith("app-token");
  });

  test("revoked user authorization asks for reconnect instead of falsely showing connected", async () => {
    const { AppError } = await import("@fleet/errors");
    mocks.findOne.mockResolvedValue({ oauthApp: "app", githubUsername: "octocat" });
    mocks.getGitHubConnection.mockRejectedValueOnce(new AppError(403, "Expired", "GITHUB_RECONNECT_REQUIRED"));
    await expect(getGitHubStatus("user-1")).resolves.toMatchObject({ connected: false, needsReconnect: true });
  });

  test("disconnect revokes only the repository App, using its own credentials", async () => {
    mocks.findOne.mockResolvedValueOnce({ oauthApp: "app" });
    mocks.getGitHubConnection.mockResolvedValueOnce({ token: "app-token" });
    await disconnectGitHub("user-1");
    expect(mocks.revokeToken).toHaveBeenCalledWith("app-id", "app-secret", "app-token");
    expect(mocks.deleteOne).toHaveBeenCalledWith({ userId: "user-1", provider: "github" });
  });
});
