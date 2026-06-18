import { User } from "@fleet/db";
import { signJWT } from "@fleet/auth";
import { getEnv } from "@fleet/config";
import { AppError } from "@fleet/errors";
import {
  exchangeCode,
  getAuthenticatedUser,
  getPrimaryEmail,
} from "../lib/github-client";
import {
  createLoginOAuthState,
  consumeLoginOAuthState,
} from "../lib/github-oauth-state";
import { upsertGitHubIntegration } from "./github-integration";

// Includes repo scopes so login also connects GitHub for deployments.
const LOGIN_SCOPES = "read:user user:email repo admin:repo_hook";
const LOGIN_INTEGRATION_SCOPES = [
  "read:user",
  "user:email",
  "repo",
  "admin:repo_hook",
] as const;

export async function getLoginRedirectUrl(): Promise<string> {
  const { GITHUB_LOGIN_CLIENT_ID, GITHUB_LOGIN_CALLBACK_URL } = getEnv();
  const state = await createLoginOAuthState();
  const params = new URLSearchParams({
    client_id: GITHUB_LOGIN_CLIENT_ID,
    redirect_uri: GITHUB_LOGIN_CALLBACK_URL,
    scope: LOGIN_SCOPES,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function handleLoginCallback(
  code: string,
  state: string,
): Promise<{ token: string; userId: string; name: string; email: string }> {
  const { GITHUB_LOGIN_CLIENT_ID, GITHUB_LOGIN_CLIENT_SECRET } = getEnv();

  const valid = await consumeLoginOAuthState(state);
  if (!valid) {
    throw new AppError(400, "Invalid or expired OAuth state", "INVALID_OAUTH_STATE");
  }

  const accessToken = await exchangeCode(
    GITHUB_LOGIN_CLIENT_ID,
    GITHUB_LOGIN_CLIENT_SECRET,
    code,
  );

  const [ghUser, primaryEmail] = await Promise.all([
    getAuthenticatedUser(accessToken),
    getPrimaryEmail(accessToken),
  ]);

  if (!primaryEmail) {
    throw new AppError(
      400,
      "Your GitHub account has no verified primary email address. Add a verified email to your GitHub account and try again.",
      "NO_VERIFIED_EMAIL",
    );
  }

  const githubId = String(ghUser.id);
  const name = ghUser.name ?? ghUser.login;

  // 1. Existing user already linked to this GitHub account.
  let user = await User.findOne({ githubId });

  if (!user) {
    // 2. Existing email/password user — link the GitHub account.
    user = await User.findOne({ email: primaryEmail });
    if (user) {
      user.githubId = githubId;
      await user.save();
    }
  }

  if (!user) {
    // 3. Brand new user — create via GitHub OAuth.
    user = await User.create({ name, email: primaryEmail, githubId });
  }

  await upsertGitHubIntegration(
    user.userId,
    accessToken,
    ghUser,
    "login",
    LOGIN_INTEGRATION_SCOPES,
  );

  const token = signJWT(user.userId);
  return { token, userId: user.userId, name: user.name, email: user.email };
}
