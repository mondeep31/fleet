/**
 * Thin typed wrapper around the GitHub REST API v3.
 * All calls authenticate with the user's stored access token.
 */

import axios, { isAxiosError, type AxiosRequestConfig } from "axios";
import type { GitHubTokenResponse } from "@fleet/github";

const GITHUB_API = "https://api.github.com";
const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

const githubApi = axios.create({
  baseURL: GITHUB_API,
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

export class GitHubApiError extends Error {
  constructor(public readonly status: number, path: string, message: string) {
    super(`GitHub API ${path} returned ${status}: ${message}`);
  }
}

// Names mirrored from packages/runtime-detector/src/detect-dockerfile.ts
export const DOCKERFILE_NAMES = ["Dockerfile", "dockerfile"] as const;

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; type?: string };
  private: boolean;
  description: string | null;
  default_branch: string;
  updated_at: string;
}

export interface GitHubBranch {
  name: string;
}

export interface DockerfileResult {
  ok: true;
  buildMethod: "dockerfile";
  dockerfilePath: string;
}

export interface RailpackResult {
  ok: true;
  buildMethod: "railpack";
}

export interface DockerfileMissing {
  ok: false;
  reason: string;
}

export type DockerfileCheckResult =
  | DockerfileResult
  | RailpackResult
  | DockerfileMissing;

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function ghFetch<T>(
  path: string,
  token: string,
  config: AxiosRequestConfig = {},
): Promise<T> {
  try {
    const response = await githubApi.request<T>({
      ...config,
      url: path,
      headers: {
        ...authHeaders(token),
        ...config.headers,
      },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const body = error.response.data as Record<string, unknown> | undefined;
      const message =
        typeof body?.message === "string" ? body.message : error.message;
      throw new GitHubApiError(error.response.status, path, message);
    }
    throw error;
  }
}

export function buildAuthorizeUrl(
  clientId: string,
  callbackUrl: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    // GitHub Apps use permissions configured on the app, not OAuth repo scopes.
    state,
  });
  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<string> {
  return (await exchangeGitHubAppCode(clientId, clientSecret, code)).access_token;
}

export async function exchangeGitHubAppCode(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<GitHubTokenResponse> {
  const { data } = await axios.post<Partial<GitHubTokenResponse> & {
    error?: string;
    error_description?: string;
  }>(
    GITHUB_TOKEN_URL,
    { client_id: clientId, client_secret: clientSecret, code },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  if (!data.access_token) {
    throw new Error(
      `GitHub token exchange failed: ${data.error_description ?? data.error ?? "unknown"}`,
    );
  }
  return { ...data, access_token: data.access_token };
}

export interface GitHubInstallation {
  id: number;
  account: { login: string };
  permissions: { contents?: string };
  repository_selection?: "all" | "selected";
  suspended_at: string | null;
}

/** These endpoints restrict results to installations authorized by this user. */
export async function listUserInstallations(token: string): Promise<GitHubInstallation[]> {
  const installations: GitHubInstallation[] = [];
  for (let page = 1; ; page++) {
    const batch = await ghFetch<{ installations: GitHubInstallation[] }>(
      `/user/installations?per_page=100&page=${page}`, token,
    );
    installations.push(...batch.installations);
    if (batch.installations.length < 100) return installations;
  }
}

export async function getAppRepositoryAccess(token: string): Promise<{
  repositorySelection: "selected" | "all" | "mixed" | "none";
  repositoryCount: number;
  contentsPermission: "read" | "write";
}> {
  const installations = (await listUserInstallations(token))
    .filter((installation) => !installation.suspended_at && installation.permissions.contents);
  const counts = await Promise.all(installations.map((installation) =>
    ghFetch<{ total_count: number }>(`/user/installations/${installation.id}/repositories?per_page=1`, token),
  ));
  const selections = new Set(installations.map((installation) => installation.repository_selection ?? "selected"));
  return {
    repositorySelection: installations.length === 0 ? "none" : selections.size > 1 ? "mixed" : selections.has("all") ? "all" : "selected",
    repositoryCount: counts.reduce((total, count) => total + count.total_count, 0),
    contentsPermission: installations.some((installation) => installation.permissions.contents === "write") ? "write" : "read",
  };
}

export async function listAppRepos(
  token: string,
  page = 1,
  perPage = 30,
  query = "",
): Promise<GitHubRepo[]> {
  const installations = await listUserInstallations(token);
  const repos = new Map<number, GitHubRepo>();
  for (const installation of installations) {
    if (installation.suspended_at) continue;
    for (let repoPage = 1; ; repoPage++) {
      const batch = await ghFetch<{ repositories: GitHubRepo[] }>(
        `/user/installations/${installation.id}/repositories?per_page=100&page=${repoPage}`, token,
      );
      for (const repo of batch.repositories) {
        if (repoMatchesQuery(repo, query)) repos.set(repo.id, repo);
      }
      if (batch.repositories.length < 100) break;
    }
  }
  return [...repos.values()]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at) || a.full_name.localeCompare(b.full_name))
    .slice((page - 1) * perPage, page * perPage);
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  return ghFetch<GitHubUser>("/user", token);
}

export async function getUserEmails(token: string): Promise<GitHubEmail[]> {
  return ghFetch<GitHubEmail[]>("/user/emails", token);
}

/** Returns the verified primary email, or null if none exists. */
export async function getPrimaryEmail(token: string): Promise<string | null> {
  const emails = await getUserEmails(token);
  const primary = emails.find((e) => e.primary && e.verified);
  return primary?.email ?? null;
}

export function repoMatchesQuery(repo: GitHubRepo, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    repo.full_name.toLowerCase().includes(normalized) ||
    repo.name.toLowerCase().includes(normalized)
  );
}

export async function listRepos(
  token: string,
  page = 1,
  perPage = 30,
): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>(
    `/user/repos?sort=updated&per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member`,
    token,
  );
}

/**
 * Search repos the authenticated user owns or can access by filtering /user/repos.
 * Uses the same affiliation as browse mode — owner, collaborator, and org member.
 */
export async function searchRepos(
  token: string,
  query: string,
  page = 1,
  perPage = 30,
): Promise<GitHubRepo[]> {
  const needed = page * perPage;
  const matches: GitHubRepo[] = [];
  let fetchPage = 1;
  const maxPages = 10;

  while (matches.length < needed && fetchPage <= maxPages) {
    const batch = await listRepos(token, fetchPage, 100);
    if (batch.length === 0) break;

    for (const repo of batch) {
      if (repoMatchesQuery(repo, query)) {
        matches.push(repo);
      }
    }

    if (batch.length < 100) break;
    fetchPage++;
  }

  const start = (page - 1) * perPage;
  return matches.slice(start, start + perPage);
}

export async function getRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubRepo> {
  return ghFetch<GitHubRepo>(`/repos/${owner}/${repo}`, token);
}

export async function listBranches(
  token: string,
  owner: string,
  repo: string,
  page = 1,
  perPage = 100,
): Promise<GitHubBranch[]> {
  return ghFetch<GitHubBranch[]>(
    `/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`,
    token,
  );
}

/**
 * Check whether a Dockerfile exists at the repository root on the given branch.
 * Tries "Dockerfile" then "dockerfile" — same priority as the worker's
 * detectDockerfile function.
 */
export async function getRootDockerfile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<DockerfileCheckResult> {
  for (const name of DOCKERFILE_NAMES) {
    const response = await githubApi.get(
      `/repos/${owner}/${repo}/contents/${name}`,
      {
        params: { ref: branch },
        headers: authHeaders(token),
        validateStatus: (status) => status === 200 || status === 404,
      },
    );

    if (response.status === 200) {
      return { ok: true, buildMethod: "dockerfile", dockerfilePath: name };
    }

    if (response.status !== 404) {
      const body = response.data as Record<string, unknown> | undefined;
      return {
        ok: false,
        reason: `GitHub API error ${response.status}: ${body?.message ?? response.statusText}`,
      };
    }
  }

  return { ok: true, buildMethod: "railpack" };
}

// ---------------------------------------------------------------------------
// Webhook hook management
// ---------------------------------------------------------------------------

export interface GitHubHook {
  id: number;
  name: string;
  active: boolean;
  events: string[];
  config: {
    url?: string;
    content_type?: string;
    insecure_ssl?: string;
  };
}

export async function listRepoHooks(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubHook[]> {
  return ghFetch<GitHubHook[]>(`/repos/${owner}/${repo}/hooks`, token);
}

export async function createRepoHook(
  token: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string,
): Promise<GitHubHook> {
  return ghFetch<GitHubHook>(`/repos/${owner}/${repo}/hooks`, token, {
    method: "POST",
    data: {
      name: "web",
      active: true,
      events: ["push"],
      config: {
        url: webhookUrl,
        content_type: "json",
        secret,
        insecure_ssl: "0",
      },
    },
  });
}

export async function deleteRepoHook(
  token: string,
  owner: string,
  repo: string,
  hookId: number,
): Promise<void> {
  // 204 = deleted, 404 = already gone — both are fine.
  await githubApi.delete(`/repos/${owner}/${repo}/hooks/${hookId}`, {
    headers: authHeaders(token),
    validateStatus: (s) => s === 204 || s === 404,
  });
}

/** Best-effort token revocation — caller should not throw on failure. */
export async function revokeToken(
  clientId: string,
  clientSecret: string,
  token: string,
): Promise<void> {
  await githubApi.delete(`/applications/${clientId}/grant`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    data: { access_token: token },
    validateStatus: () => true,
  });
}
