import { Integration } from "@fleet/db";
import { decryptSecret } from "@fleet/secrets";
import { getSharedEnv, getEnv } from "@fleet/config";
import { AppError } from "@fleet/errors";
import { encryptGitHubTokens, getGitHubConnection } from "@fleet/github";
import {
  buildAuthorizeUrl,
  exchangeGitHubAppCode,
  getAuthenticatedUser,
  listUserInstallations,
  getAppRepositoryAccess,
  GitHubApiError,
  revokeToken,
} from "../lib/github-client";
import {
  createOAuthState,
  consumeOAuthState,
  createInstallationState,
  consumeInstallationState,
  type GitHubReturnTo,
} from "../lib/github-oauth-state";

export { getDecryptedGitHubToken, getGitHubConnection } from "@fleet/github";

function getAppConfig() {
  const env = getEnv();
  const { GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET, GITHUB_APP_SLUG, GITHUB_APP_CALLBACK_URL } = env;
  if (!GITHUB_APP_CLIENT_ID || !GITHUB_APP_CLIENT_SECRET || !GITHUB_APP_SLUG || !GITHUB_APP_CALLBACK_URL) {
    throw new AppError(503, "GitHub repository connections are not configured.", "GITHUB_APP_NOT_CONFIGURED");
  }
  return { clientId: GITHUB_APP_CLIENT_ID, clientSecret: GITHUB_APP_CLIENT_SECRET, slug: GITHUB_APP_SLUG, callbackUrl: GITHUB_APP_CALLBACK_URL };
}

export async function getConnectRedirectUrl(userId: string, returnTo: GitHubReturnTo = "/connections"): Promise<string> {
  // Authorize first so an existing GitHub installation connects immediately.
  // The callback opens installation only when GitHub reports none accessible.
  return getAuthorizationRedirectUrl(userId, returnTo, true);
}

export async function getInstallationRedirectUrl(userId: string, returnTo: GitHubReturnTo = "/connections"): Promise<string> {
  const { slug } = getAppConfig();
  const state = await createInstallationState(userId, returnTo);
  return `https://github.com/apps/${slug}/installations/new?${new URLSearchParams({ state })}`;
}

export async function getAuthorizationRedirectUrl(userId: string, returnTo: GitHubReturnTo = "/connections", installIfMissing = false): Promise<string> {
  const { clientId, callbackUrl } = getAppConfig();
  const state = await createOAuthState(userId, returnTo, installIfMissing);
  return buildAuthorizeUrl(clientId, callbackUrl, state);
}

/** Installation IDs from the browser are untrusted. Authorize the installing user instead. */
export async function handleInstallationSetup(state: string): Promise<string> {
  const context = await consumeInstallationState(state);
  if (!context) {
    throw new AppError(400, "Invalid or expired installation state", "INVALID_OAUTH_STATE");
  }
  return getAuthorizationRedirectUrl(context.userId, context.returnTo);
}

export async function handleOAuthCallback(code: string, state: string): Promise<{ redirectUrl: string; connected: boolean }> {
  const { clientId, clientSecret } = getAppConfig();
  const context = await consumeOAuthState(state);
  if (!context) {
    throw new AppError(400, "Invalid or expired OAuth state", "INVALID_OAUTH_STATE");
  }
  const { userId } = context;

  const tokens = await exchangeGitHubAppCode(clientId, clientSecret, code);
  const [ghUser, installations] = await Promise.all([
    getAuthenticatedUser(tokens.access_token),
    listUserInstallations(tokens.access_token),
  ]);
  // Verify access through GitHub, never through a supplied installation_id.
  if (!installations.some((installation) => !installation.suspended_at && installation.permissions.contents)) {
    if (context.installIfMissing && installations.length === 0) {
      return { redirectUrl: await getInstallationRedirectUrl(userId, context.returnTo), connected: false };
    }
    throw new AppError(403, "Install Fleet on at least one account with read access to repository contents. An organization owner may need to approve the installation.", "GITHUB_INSTALLATION_REQUIRED");
  }

  await Integration.findOneAndUpdate(
    { userId, provider: "github" },
    {
      $set: {
        userId,
        provider: "github",
        ...encryptGitHubTokens(tokens),
        githubUserId: String(ghUser.id),
        githubUsername: ghUser.login,
        scopes: [],
        oauthApp: "app",
        connectedAt: new Date(),
      },
      $unset: { tokenRefreshLockId: 1, tokenRefreshLockUntil: 1 },
    },
    { upsert: true, new: true },
  );

  return {
    redirectUrl: context.returnTo
      ? new URL(context.returnTo, getSharedEnv().DASHBOARD_URL).toString()
      : getEnv().GITHUB_OAUTH_SUCCESS_REDIRECT,
    connected: true,
  };
}

export async function getGitHubStatus(userId: string): Promise<{
  connected: boolean;
  username?: string;
  needsReconnect?: boolean;
  fineGrained?: boolean;
  repositorySelection?: "selected" | "all" | "mixed" | "none";
  repositoryCount?: number;
  contentsPermission?: "read" | "write";
}> {
  const integration = await Integration.findOne({ userId, provider: "github" });
  if (!integration) return { connected: false };
  const fineGrained = integration.oauthApp === "app";
  const refreshExpired = fineGrained && integration.refreshTokenExpiresAt && integration.refreshTokenExpiresAt.getTime() <= Date.now();
  if (refreshExpired) return { connected: false, username: integration.githubUsername ?? undefined, fineGrained: true, needsReconnect: true };
  let access;
  if (fineGrained && !refreshExpired) {
    try {
      const { token } = await getGitHubConnection(userId);
      access = await getAppRepositoryAccess(token);
    } catch (error) {
      if ((error instanceof AppError && ["GITHUB_RECONNECT_REQUIRED", "GITHUB_NOT_CONNECTED"].includes(error.code ?? "")) ||
          (error instanceof GitHubApiError && error.status === 401)) {
        return { connected: false, username: integration.githubUsername ?? undefined, fineGrained: true, needsReconnect: true };
      }
      throw error;
    }
  }
  return {
    connected: true,
    username: integration.githubUsername ?? undefined,
    fineGrained,
    ...access,
    ...(!fineGrained || refreshExpired ? { needsReconnect: true } : {}),
  };
}

export async function disconnectGitHub(userId: string): Promise<void> {
  const integration = await Integration.findOne({ userId, provider: "github" });
  if (!integration) return;

  try {
    const env = getEnv();
    const [clientId, clientSecret] = integration.oauthApp === "app"
      ? [env.GITHUB_APP_CLIENT_ID, env.GITHUB_APP_CLIENT_SECRET]
      : integration.oauthApp === "login"
        ? [env.GITHUB_LOGIN_CLIENT_ID, env.GITHUB_LOGIN_CLIENT_SECRET]
        : [env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET];
    if (clientId && clientSecret) {
      const token = integration.oauthApp === "app"
        ? (await getGitHubConnection(userId)).token
        : decryptSecret(integration, getSharedEnv().FLEET_SECRETS_ENCRYPTION_KEY);
      await revokeToken(clientId, clientSecret, token);
    }
  } catch {
    // Best effort: an expired or revoked grant must not prevent local disconnect.
  }
  await Integration.deleteOne({ userId, provider: "github" });
}
