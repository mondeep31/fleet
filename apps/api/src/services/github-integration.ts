import { Integration } from "@fleet/db";
import { encryptSecret, decryptSecret } from "@fleet/secrets";
import { getSharedEnv, getEnv } from "@fleet/config";
import { AppError } from "@fleet/errors";
import {
  buildAuthorizeUrl,
  exchangeCode,
  getAuthenticatedUser,
  revokeToken,
} from "../lib/github-client";
import { createOAuthState, consumeOAuthState } from "../lib/github-oauth-state";

export async function getConnectRedirectUrl(userId: string): Promise<string> {
  const { GITHUB_CLIENT_ID, GITHUB_OAUTH_CALLBACK_URL } = getEnv();
  const state = await createOAuthState(userId);
  return buildAuthorizeUrl(GITHUB_CLIENT_ID, GITHUB_OAUTH_CALLBACK_URL, state);
}

export async function handleOAuthCallback(
  code: string,
  state: string,
): Promise<string> {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_OAUTH_SUCCESS_REDIRECT } = getEnv();
  const { FLEET_SECRETS_ENCRYPTION_KEY } = getSharedEnv();

  const userId = await consumeOAuthState(state);
  if (!userId) {
    throw new AppError(400, "Invalid or expired OAuth state", "INVALID_OAUTH_STATE");
  }

  const accessToken = await exchangeCode(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, code);
  const ghUser = await getAuthenticatedUser(accessToken);
  const encrypted = encryptSecret(accessToken, FLEET_SECRETS_ENCRYPTION_KEY);

  await Integration.findOneAndUpdate(
    { userId, provider: "github" },
    {
      userId,
      provider: "github",
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      githubUserId: String(ghUser.id),
      githubUsername: ghUser.login,
      scopes: ["read:user", "repo", "admin:repo_hook"],
      connectedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  return GITHUB_OAUTH_SUCCESS_REDIRECT;
}

export async function getGitHubStatus(
  userId: string,
): Promise<{ connected: boolean; username?: string; needsReconnect?: boolean }> {
  const integration = await Integration.findOne({ userId, provider: "github" });
  if (!integration) return { connected: false };
  const needsReconnect = !integration.scopes.includes("admin:repo_hook");
  return {
    connected: true,
    username: integration.githubUsername,
    ...(needsReconnect ? { needsReconnect: true } : {}),
  };
}

export async function disconnectGitHub(userId: string): Promise<void> {
  const integration = await Integration.findOne({ userId, provider: "github" });
  if (!integration) return;

  // Best-effort revoke on GitHub side.
  try {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = getEnv();
    const { FLEET_SECRETS_ENCRYPTION_KEY } = getSharedEnv();
    const token = decryptSecret(
      { ciphertext: integration.ciphertext, iv: integration.iv, authTag: integration.authTag },
      FLEET_SECRETS_ENCRYPTION_KEY,
    );
    await revokeToken(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, token);
  } catch {
    // Ignore revocation errors — always delete locally.
  }

  await Integration.deleteOne({ userId, provider: "github" });
}

export async function getDecryptedGitHubToken(userId: string): Promise<string> {
  const { FLEET_SECRETS_ENCRYPTION_KEY } = getSharedEnv();
  const integration = await Integration.findOne({ userId, provider: "github" });
  if (!integration) {
    throw new AppError(
      403,
      "GitHub is not connected. Connect GitHub on the Connections page.",
      "GITHUB_NOT_CONNECTED",
    );
  }
  return decryptSecret(
    { ciphertext: integration.ciphertext, iv: integration.iv, authTag: integration.authTag },
    FLEET_SECRETS_ENCRYPTION_KEY,
  );
}
