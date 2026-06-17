import type { RequestHandler } from "express";
import { AppError } from "@fleet/errors";
import { getSharedEnv } from "@fleet/config";
import { getLoginRedirectUrl, handleLoginCallback } from "../services/github-auth";

export const githubLoginAuthorizeController: RequestHandler = async (_req, res) => {
  const url = await getLoginRedirectUrl();
  res.redirect(url);
};

export const githubLoginCallbackController: RequestHandler = async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) {
    throw new AppError(400, "Missing code or state", "BAD_REQUEST");
  }

  const { DASHBOARD_URL } = getSharedEnv();
  const callbackBase = `${DASHBOARD_URL}/auth/github/callback`;

  try {
    const { token, userId, name, email } = await handleLoginCallback(code, state);
    const params = new URLSearchParams({
      token,
      userId,
      name,
      email,
    });
    res.redirect(`${callbackBase}?${params.toString()}`);
  } catch (err) {
    const errorCode =
      err instanceof AppError ? err.code : "OAUTH_ERROR";
    const message =
      err instanceof Error ? err.message : "OAuth failed";
    const params = new URLSearchParams({ error: errorCode, message });
    res.redirect(`${callbackBase}?${params.toString()}`);
  }
};
