import type { RequestHandler } from "express";
import { getEnv } from "@fleet/config";
import { verifyGitHubSignature } from "../lib/github-webhook";
import { handleGitHubWebhookDelivery } from "../services/github-webhook";

export const githubWebhookController: RequestHandler = async (req, res) => {
  const { GITHUB_WEBHOOK_SECRET } = getEnv();

  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const event = req.headers["x-github-event"] as string | undefined;

  // req.body is a Buffer because the route uses express.raw()
  const rawBody = req.body as Buffer;

  if (!verifyGitHubSignature(rawBody, signature, GITHUB_WEBHOOK_SECRET)) {
    res.status(401).json({ success: false, message: "Invalid signature" });
    return;
  }

  if (!event) {
    res.status(400).json({ success: false, message: "Missing X-GitHub-Event header" });
    return;
  }

  // Respond immediately — deploys are async via BullMQ.
  const result = await handleGitHubWebhookDelivery(event, rawBody);
  res.status(200).json({ success: true, ...result });
};
