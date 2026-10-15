import type { Request, Response } from "express";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthorizationRedirectUrl: vi.fn(), handleInstallationSetup: vi.fn(),
  handleOAuthCallback: vi.fn(),
}));
vi.mock("@fleet/config", () => ({ getSharedEnv: () => ({ DASHBOARD_URL: "https://fleet.example.com" }) }));
vi.mock("../services/github-integration", () => ({
  ...mocks,
  getConnectRedirectUrl: vi.fn(), getInstallationRedirectUrl: vi.fn(),
  getGitHubStatus: vi.fn(), disconnectGitHub: vi.fn(),
}));
vi.mock("../services/github-repos", () => ({
  listUserRepos: vi.fn(), getRepoMetadata: vi.fn(), listRepoBranches: vi.fn(), validateRepoDockerfile: vi.fn(),
}));
import { authorizeGitHubController, githubInstallationSetupController, githubCallbackController } from "./github-integration";

const redirect = vi.fn();
const res = { redirect } as unknown as Response;
beforeEach(() => vi.resetAllMocks());

test("an existing installation returns Connected from the normal Connect flow", async () => {
  mocks.handleOAuthCallback.mockResolvedValue({ redirectUrl: "https://fleet.example.com/connections", connected: true });
  await githubCallbackController({ query: { code: "code", state: "state" } } as unknown as Request, res, vi.fn());
  expect(redirect).toHaveBeenCalledWith("https://fleet.example.com/api/integrations/github/complete?github=connected&returnTo=%2Fconnections");
});

test("a new installation redirect is not mislabeled as an already connected account", async () => {
  mocks.handleOAuthCallback.mockResolvedValue({ redirectUrl: "https://github.com/apps/fleet-repos/installations/new?state=installation", connected: false });
  await githubCallbackController({ query: { code: "code", state: "state" } } as unknown as Request, res, vi.fn());
  expect(redirect).toHaveBeenCalledWith("https://github.com/apps/fleet-repos/installations/new?state=installation");
});

test("an install initiated in Fleet uses its saved nonce to authorize", async () => {
  mocks.handleInstallationSetup.mockResolvedValue("https://github.com/login/oauth/authorize?state=fresh");
  await githubInstallationSetupController({ query: { state: "install-state", installation_id: "123" } } as unknown as Request, res, vi.fn());
  expect(mocks.handleInstallationSetup).toHaveBeenCalledWith("install-state");
  expect(redirect).toHaveBeenCalledWith("https://github.com/login/oauth/authorize?state=fresh");
});

test("GitHub updates without state resume through the authenticated Fleet session", async () => {
  await githubInstallationSetupController({ query: { installation_id: "forged", setup_action: "update" } } as unknown as Request, res, vi.fn());
  expect(redirect).toHaveBeenCalledWith("https://fleet.example.com/api/integrations/github/authorize");
  expect(mocks.handleInstallationSetup).not.toHaveBeenCalled();
  expect(mocks.getAuthorizationRedirectUrl).not.toHaveBeenCalled();
});

test("authorization uses the authenticated Fleet user, ignoring supplied user/installation IDs", async () => {
  mocks.getAuthorizationRedirectUrl.mockResolvedValue("https://github.com/login/oauth/authorize?state=bound");
  await authorizeGitHubController({ user: { userId: "session-user" }, query: { userId: "attacker", installation_id: "123" } } as unknown as Request, res, vi.fn());
  expect(mocks.getAuthorizationRedirectUrl).toHaveBeenCalledWith("session-user", "/connections");
  expect(redirect).toHaveBeenCalledWith("https://github.com/login/oauth/authorize?state=bound");
});

test("a pending organization installation explains approval even without state", async () => {
  await githubInstallationSetupController({ query: { setup_action: "request" } } as unknown as Request, res, vi.fn());
  expect(redirect).toHaveBeenCalledWith("https://fleet.example.com/api/integrations/github/complete?github=approval_required");
  expect(mocks.handleInstallationSetup).not.toHaveBeenCalled();
});

test("a replayed/expired installation nonce cannot authorize a connection", async () => {
  mocks.handleInstallationSetup.mockRejectedValue(new Error("Invalid state"));
  await githubInstallationSetupController({ query: { state: "expired" } } as unknown as Request, res, vi.fn());
  expect(redirect).toHaveBeenCalledWith("https://fleet.example.com/api/integrations/github/complete?github=error");
  expect(mocks.getAuthorizationRedirectUrl).not.toHaveBeenCalled();
});
