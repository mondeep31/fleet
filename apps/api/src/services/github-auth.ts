import { randomBytes } from "node:crypto";
import { getEnv } from "@fleet/config";
import { User } from "@fleet/db";
import { AppError } from "@fleet/errors";
import { signJWT } from "@fleet/auth";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmailResponse {
  email: string;
  primary: boolean;
  verified: boolean;
}

function getGitHubOAuthConfig() {
  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_OAUTH_CALLBACK_URL,
    GITHUB_OAUTH_SCOPES,
  } = getEnv();

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    throw new AppError(
      500,
      "GitHub OAuth is not configured",
      "GITHUB_OAUTH_NOT_CONFIGURED",
    );
  }

  return {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackUrl: GITHUB_OAUTH_CALLBACK_URL,
    scopes: GITHUB_OAUTH_SCOPES,
  };
}

export function createGitHubOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function getGitHubAuthorizationUrl(state: string): string {
  const { clientId, callbackUrl, scopes } = getGitHubOAuthConfig();
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeCodeForAccessToken(code: string): Promise<string> {
  const { clientId, clientSecret, callbackUrl } = getGitHubOAuthConfig();
  const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
  });

  const payload = (await response.json()) as GitHubTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new AppError(
      401,
      payload.error_description ?? "GitHub OAuth token exchange failed",
      payload.error ?? "GITHUB_TOKEN_EXCHANGE_FAILED",
    );
  }

  return payload.access_token;
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new AppError(401, "Failed to fetch GitHub user", "GITHUB_USER_FAILED");
  }

  return (await response.json()) as GitHubUserResponse;
}

async function fetchPrimaryEmail(accessToken: string): Promise<string | null> {
  const response = await fetch(`${GITHUB_API_URL}/user/emails`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) return null;

  const emails = (await response.json()) as GitHubEmailResponse[];
  return (
    emails.find((email) => email.primary && email.verified)?.email ??
    emails.find((email) => email.verified)?.email ??
    null
  );
}

export async function loginWithGitHub(code: string) {
  const accessToken = await exchangeCodeForAccessToken(code);
  const githubUser = await fetchGitHubUser(accessToken);
  const email = githubUser.email ?? (await fetchPrimaryEmail(accessToken));

  if (!email) {
    throw new AppError(
      400,
      "GitHub account does not expose a verified email",
      "GITHUB_EMAIL_UNAVAILABLE",
    );
  }

  const user = await User.findOneAndUpdate(
    {
      $or: [{ githubId: String(githubUser.id) }, { email }],
    },
    {
      $set: {
        name: githubUser.name ?? githubUser.login,
        email,
        authProvider: "github",
        githubId: String(githubUser.id),
        githubLogin: githubUser.login,
        githubAvatarUrl: githubUser.avatar_url,
        githubAccessToken: accessToken,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  const token = signJWT(user.userId);
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    token,
  };
}
