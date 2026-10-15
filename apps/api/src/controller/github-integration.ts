import type { RequestHandler, Response } from "express";
import { AppError } from "@fleet/errors";
import { getSharedEnv } from "@fleet/config";
import { normalizeGitHubReturnTo } from "../lib/github-oauth-state";
import {
  getConnectRedirectUrl,
  getInstallationRedirectUrl,
  getAuthorizationRedirectUrl,
  handleOAuthCallback,
  getGitHubStatus,
  disconnectGitHub,
  handleInstallationSetup,
} from "../services/github-integration";
import {
  listUserRepos,
  getRepoMetadata,
  listRepoBranches,
  validateRepoDockerfile,
} from "../services/github-repos";
import type {
  RepoOwnerRepoParams,
  ValidateDockerfileBody,
  ReposQuery,
} from "../validators/github";

function completeGitHubConnection(res: Response, result: string, returnTo?: string) {
  const url = new URL("/api/integrations/github/complete", getSharedEnv().DASHBOARD_URL);
  url.searchParams.set("github", result);
  if (returnTo) url.searchParams.set("returnTo", normalizeGitHubReturnTo(returnTo));
  res.redirect(url.toString());
}

export const connectGitHubController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const redirectUrl = await getConnectRedirectUrl(userId, normalizeGitHubReturnTo(req.query.returnTo));
  res.redirect(redirectUrl);
};

export const authorizeGitHubController: RequestHandler = async (req, res) => {
  res.redirect(await getAuthorizationRedirectUrl(req.user!.userId, normalizeGitHubReturnTo(req.query.returnTo)));
};

export const installGitHubController: RequestHandler = async (req, res) => {
  res.redirect(await getInstallationRedirectUrl(req.user!.userId, normalizeGitHubReturnTo(req.query.returnTo)));
};

export const githubCallbackController: RequestHandler = async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  try {
    if (!code || !state || typeof code !== "string" || typeof state !== "string") {
      throw new AppError(400, "Missing code or state", "BAD_REQUEST");
    }
    const result = await handleOAuthCallback(code, state);
    if (result.connected) {
      completeGitHubConnection(res, "connected", new URL(result.redirectUrl).pathname);
    } else {
      res.redirect(result.redirectUrl);
    }
  } catch (error) {
    const result = error instanceof AppError && error.code === "GITHUB_INSTALLATION_REQUIRED"
      ? "installation_required"
      : "error";
    completeGitHubConnection(res, result);
  }
};

export const githubInstallationSetupController: RequestHandler = async (req, res) => {
  const { state, setup_action } = req.query;
  if (setup_action === "request") {
    completeGitHubConnection(res, "approval_required");
    return;
  }
  // GitHub settings updates/direct installations may have no Fleet nonce.
  // Resume through the dashboard's authenticated session, never installation_id.
  if (typeof state !== "string" || !state) {
    res.redirect(`${getSharedEnv().DASHBOARD_URL}/api/integrations/github/authorize`);
    return;
  }
  try {
    res.redirect(await handleInstallationSetup(state));
  } catch {
    completeGitHubConnection(res, "error");
  }
};

export const getGitHubStatusController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const status = await getGitHubStatus(userId);
  res.json({ success: true, message: "GitHub status", data: status });
};

export const disconnectGitHubController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  await disconnectGitHub(userId);
  res.json({ success: true, message: "GitHub disconnected", data: null });
};

export const listReposController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { page, per_page, q } = req.query as unknown as ReposQuery;
  const repos = await listUserRepos(userId, page, per_page, q);
  res.json({ success: true, message: "Repos fetched", data: repos });
};

export const getRepoController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { owner, repo } = req.params as RepoOwnerRepoParams;
  const metadata = await getRepoMetadata(userId, owner, repo);
  res.json({ success: true, message: "Repo fetched", data: metadata });
};

export const listBranchesController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { owner, repo } = req.params as RepoOwnerRepoParams;
  const branches = await listRepoBranches(userId, owner, repo);
  res.json({ success: true, message: "Branches fetched", data: branches });
};

export const validateDockerfileController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { owner, repo, branch } = req.body as ValidateDockerfileBody;
  const result = await validateRepoDockerfile(userId, owner, repo, branch);
  res.json({ success: true, message: "Validation complete", data: result });
};
