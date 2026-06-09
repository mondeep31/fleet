import type { RequestHandler } from "express";
import { getEnv } from "@fleet/config";
import { AppError } from "@fleet/errors";
import {
  createGitHubOAuthState,
  getGitHubAuthorizationUrl,
  loginWithGitHub,
} from "../services/github-auth";

const STATE_COOKIE = "fleet_github_oauth_state";

function readCookie(header: string | undefined, key: string): string | null {
  if (!header) return null;
  const cookies = header.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.slice(key.length + 1)) : null;
}

export const startGitHubOAuthController: RequestHandler = (_req, res) => {
  const state = createGitHubOAuthState();
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });
  res.redirect(getGitHubAuthorizationUrl(state));
};

export const githubOAuthCallbackController: RequestHandler = async (
  req,
  res,
) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const storedState = readCookie(req.headers.cookie, STATE_COOKIE);

  res.clearCookie(STATE_COOKIE);

  if (!code || !state || !storedState || state !== storedState) {
    throw new AppError(400, "Invalid GitHub OAuth callback", "INVALID_OAUTH");
  }

  const session = await loginWithGitHub(code);
  const callbackUrl = new URL("/auth/github/callback", getEnv().DASHBOARD_URL);
  callbackUrl.searchParams.set("token", session.token);
  callbackUrl.searchParams.set("userId", session.userId);
  callbackUrl.searchParams.set("name", session.name);
  callbackUrl.searchParams.set("email", session.email);

  res.redirect(callbackUrl.toString());
};
