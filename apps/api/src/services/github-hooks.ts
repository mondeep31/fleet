import { Project } from "@fleet/db";
import { getEnv } from "@fleet/config";
import { AppError } from "@fleet/errors";
import {
  listRepoHooks,
  createRepoHook,
  deleteRepoHook,
} from "../lib/github-client";
import { getDecryptedGitHubToken } from "./github-integration";
import { requireGitHubRepoKey } from "../lib/github-repo-url";

/**
 * Ensures a Fleet push webhook exists on the GitHub repo.
 * Deduplicates: if a hook pointing at our API_URL already exists, reuses it.
 * Returns the numeric GitHub hook ID to be stored on the Project.
 *
 * Throws AppError when hook creation fails (e.g. missing admin:repo_hook scope,
 * no push access to the repo).
 */
export async function ensureRepoWebhook(
  userId: string,
  owner: string,
  repo: string,
): Promise<number> {
  const { API_URL, GITHUB_WEBHOOK_SECRET } = getEnv();
  const webhookUrl = `${API_URL}/webhooks/github`;

  const token = await getDecryptedGitHubToken(userId);

  let hooks: Awaited<ReturnType<typeof listRepoHooks>>;
  try {
    hooks = await listRepoHooks(token, owner, repo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // 403 = missing admin:repo_hook scope, 404 = no push access / private repo
    if (msg.includes("403") || msg.includes("404")) {
      throw new AppError(
        403,
        "Could not register auto-deploy webhook. Reconnect GitHub with admin:repo_hook scope, or ensure you have admin access to this repository.",
        "GITHUB_HOOK_FAILED",
      );
    }
    throw err;
  }

  const existing = hooks.find((h) => h.config.url === webhookUrl);
  if (existing) return existing.id;

  try {
    const hook = await createRepoHook(token, owner, repo, webhookUrl, GITHUB_WEBHOOK_SECRET);
    return hook.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("403")) {
      throw new AppError(
        403,
        "Could not register auto-deploy webhook. Reconnect GitHub with admin:repo_hook scope, or ensure you have admin access to this repository.",
        "GITHUB_HOOK_FAILED",
      );
    }
    throw err;
  }
}

/**
 * Deletes the Fleet push webhook from GitHub when a project is archived,
 * but only if no other active project on the same repo still needs it.
 * Best-effort — logs and swallows errors so archiving always succeeds.
 */
export async function removeRepoWebhookIfUnused(
  userId: string,
  archivedProjectId: string,
  repoUrl: string,
  hookId: number | undefined,
): Promise<void> {
  if (!hookId) return;

  let repoKey: string;
  try {
    repoKey = requireGitHubRepoKey(repoUrl);
  } catch {
    return; // non-GitHub repo — nothing to do
  }

  const [owner, repo] = repoKey.split("/") as [string, string];

  // Check whether any other active project still points at this repo.
  const siblings = await Project.find({
    projectId: { $ne: archivedProjectId },
    status: "active",
    repoUrl: { $regex: repoKey.replace("/", "\\/"), $options: "i" },
  });

  if (siblings.length > 0) return; // another project still needs the hook

  try {
    const token = await getDecryptedGitHubToken(userId);
    await deleteRepoHook(token, owner, repo, hookId);
  } catch (err) {
    // Best-effort: log but don't block the archive operation.
    console.error(`Failed to delete GitHub webhook ${hookId} for ${repoKey}:`, err);
  }
}
