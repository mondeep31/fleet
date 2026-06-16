import type { RequestHandler } from "express";
import { AppError } from "@fleet/errors";
import {
  getConnectRedirectUrl,
  handleOAuthCallback,
  getGitHubStatus,
  disconnectGitHub,
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

export const connectGitHubController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const redirectUrl = await getConnectRedirectUrl(userId);
  res.redirect(redirectUrl);
};

export const githubCallbackController: RequestHandler = async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) {
    throw new AppError(400, "Missing code or state", "BAD_REQUEST");
  }
  const successUrl = await handleOAuthCallback(code, state);
  res.redirect(`${successUrl}?github=connected`);
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
