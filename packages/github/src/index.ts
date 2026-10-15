import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { Integration } from "@fleet/db";
import { getSharedEnv } from "@fleet/config";
import { AppError } from "@fleet/errors";
import { encryptSecret, decryptSecret } from "@fleet/secrets";

export interface GitHubTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

export function encryptGitHubTokens(tokens: GitHubTokenResponse) {
  const { FLEET_SECRETS_ENCRYPTION_KEY: key } = getSharedEnv();
  return {
    ...encryptSecret(tokens.access_token, key),
    tokenExpiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    refreshToken: tokens.refresh_token ? encryptSecret(tokens.refresh_token, key) : null,
    refreshTokenExpiresAt: tokens.refresh_token_expires_in
      ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000)
      : null,
  };
}

function reconnectError() {
  return new AppError(403, "GitHub authorization expired or was revoked. Reconnect GitHub on the Connections page.", "GITHUB_RECONNECT_REQUIRED");
}

/** Shared by API and worker; serializes refresh-token rotation across processes. */
export async function getGitHubConnection(userId: string): Promise<{
  token: string;
  authType: "app" | "oauth";
}> {
  const env = getSharedEnv();
  const filter = { userId, provider: "github" as const };
  const deadline = Date.now() + 12_000;

  while (Date.now() < deadline) {
    const integration = await Integration.findOne(filter);
    if (!integration) {
      throw new AppError(403, "GitHub is not connected. Connect GitHub on the Connections page.", "GITHUB_NOT_CONNECTED");
    }
    const authType = integration.oauthApp === "app" ? "app" : "oauth";
    const key = env.FLEET_SECRETS_ENCRYPTION_KEY;
    if (authType === "oauth" || !integration.tokenExpiresAt || integration.tokenExpiresAt.getTime() > Date.now() + 60_000) {
      return { token: decryptSecret(integration, key), authType };
    }

    const refresh = integration.refreshToken;
    if (!refresh?.ciphertext || !refresh.iv || !refresh.authTag ||
        !env.GITHUB_APP_CLIENT_ID || !env.GITHUB_APP_CLIENT_SECRET ||
        (integration.refreshTokenExpiresAt && integration.refreshTokenExpiresAt.getTime() <= Date.now())) {
      throw reconnectError();
    }

    const lockId = randomUUID();
    const locked = await Integration.findOneAndUpdate(
      {
        ...filter,
        ciphertext: integration.ciphertext,
        $or: [
          { tokenRefreshLockUntil: { $exists: false } },
          { tokenRefreshLockUntil: null },
          { tokenRefreshLockUntil: { $lte: new Date() } },
        ],
      },
      { $set: { tokenRefreshLockId: lockId, tokenRefreshLockUntil: new Date(Date.now() + 30_000) } },
      { new: true },
    );
    if (!locked) {
      await setTimeout(100);
      continue;
    }

    const lockedFilter = { ...filter, tokenRefreshLockId: lockId, ciphertext: integration.ciphertext };
    try {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_APP_CLIENT_ID,
          client_secret: env.GITHUB_APP_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: decryptSecret({ ciphertext: refresh.ciphertext, iv: refresh.iv, authTag: refresh.authTag }, key),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        throw new AppError(502, "GitHub token refresh failed. Please try again.", "GITHUB_REFRESH_FAILED");
      }
      const tokens = await response.json() as GitHubTokenResponse & { error?: string };
      if (tokens.error || !tokens.access_token || !tokens.refresh_token || !tokens.expires_in) throw reconnectError();
      const saved = await Integration.findOneAndUpdate(
        lockedFilter,
        {
          $set: encryptGitHubTokens(tokens),
          $unset: { tokenRefreshLockId: 1, tokenRefreshLockUntil: 1 },
        },
        { new: true },
      );
      // A reconnect/disconnect may have replaced the grant during the request.
      if (!saved) continue;
      return { token: tokens.access_token, authType };
    } finally {
      await Integration.updateOne(lockedFilter, { $unset: { tokenRefreshLockId: 1, tokenRefreshLockUntil: 1 } });
    }
  }
  throw new AppError(503, "GitHub authorization is being refreshed. Please try again.", "GITHUB_REFRESH_BUSY");
}

/** Also enforce selection for public repos, which GitHub user tokens can read implicitly. */
export async function assertGitHubRepositoryAccess(token: string, repository: string): Promise<void> {
  async function request<T>(path: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401) throw reconnectError();
    if (!response.ok) throw new AppError(403, "Cannot access this repository. Check your GitHub repository selection and permissions.", "GITHUB_REPO_ACCESS_DENIED");
    return await response.json() as T;
  }

  for (let page = 1; ; page++) {
    const { installations } = await request<{ installations: { id: number; suspended_at: string | null }[] }>(`/user/installations?per_page=100&page=${page}`);
    for (const installation of installations) {
      if (installation.suspended_at) continue;
      for (let repoPage = 1; ; repoPage++) {
        const { repositories } = await request<{ repositories: { full_name: string }[] }>(`/user/installations/${installation.id}/repositories?per_page=100&page=${repoPage}`);
        if (repositories.some((repo) => repo.full_name.toLowerCase() === repository.toLowerCase())) return;
        if (repositories.length < 100) break;
      }
    }
    if (installations.length < 100) break;
  }
  throw new AppError(403, "This repository is not selected for Fleet. Manage repository access on the Connections page.", "GITHUB_REPO_ACCESS_DENIED");
}

export async function getDecryptedGitHubToken(userId: string, repository?: string): Promise<string> {
  const { token, authType } = await getGitHubConnection(userId);
  if (authType === "app" && repository) await assertGitHubRepositoryAccess(token, repository);
  return token;
}
