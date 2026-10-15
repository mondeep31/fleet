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
  revokeToken,
} from "../lib/github-client";
import {
  createOAuthState,
  consumeOAuthState,
  createInstallationState,
  consumeInstallationState,
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

export async function getConnectRedirectUrl(userId: string): Promise<string> {
  const { slug } = getAppConfig();
  const state = await createInstallationState(userId);
  return `https://github.com/apps/${slug}/installations/new?${new URLSearchParams({ state })}`;
}

/** Installation IDs from the browser are untrusted. Authorize the installing user instead. */
export async function handleInstallationSetup(state: string): Promise<string> {
  const { clientId, callbackUrl } = getAppConfig();
  const userId = await consumeInstallationState(state);
  if (!userId) {
    throw new AppError(400, "Invalid or expired installation state", "INVALID_OAUTH_STATE");
  }
  const oauthState = await createOAuthState(userId);
  return buildAuthorizeUrl(clientId, callbackUrl, oauthState);
}

export async function handleOAuthCallback(code: string, state: string): Promise<string> {
  const { clientId, clientSecret } = getAppConfig();
  const userId = await consumeOAuthState(state);
  if (!userId) {
    throw new AppError(400, "Invalid or expired OAuth state", "INVALID_OAUTH_STATE");
  }

  const tokens = await exchangeGitHubAppCode(clientId, clientSecret, code);
  const [ghUser, installations] = await Promise.all([
    getAuthenticatedUser(tokens.access_token),
    listUserInstallations(tokens.access_token),
  ]);
  // Verify access through GitHub, never through a supplied installation_id.
  if (!installations.some((installation) => !installation.suspended_at && installation.permissions.contents)) {
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

  return getEnv().GITHUB_OAUTH_SUCCESS_REDIRECT;
}

export async function getGitHubStatus(userId: string): Promise<{
  connected: boolean;
  username?: string;
  needsReconnect?: boolean;
  fineGrained?: boolean;
}> {
  const integration = await Integration.findOne({ userId, provider: "github" });
  if (!integration) return { connected: false };
  const fineGrained = integration.oauthApp === "app";
  const refreshExpired = fineGrained && integration.refreshTokenExpiresAt && integration.refreshTokenExpiresAt.getTime() <= Date.now();
  return {
    connected: true,
    username: integration.githubUsername ?? undefined,
    fineGrained,
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
