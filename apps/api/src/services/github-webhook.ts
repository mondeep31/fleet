import { Project } from "@fleet/db";
import { parsePushEvent, extractBranchFromRef } from "../lib/github-webhook";
import { parseGitHubRepoKey } from "../lib/github-repo-url";
import { triggerDeployForProject } from "./project";

/**
 * Processes a verified GitHub webhook delivery.
 *
 * For `push` events: finds all active projects whose repoUrl and branch match
 * the push, and enqueues a deployment for each. Already-in-progress deployments
 * are silently skipped (debounces rapid pushes).
 *
 * Returns a summary for logging.
 */
export async function handleGitHubWebhookDelivery(
  event: string,
  rawBody: Buffer,
): Promise<{ handled: boolean; deploys: number }> {
  if (event === "ping") {
    return { handled: true, deploys: 0 };
  }

  if (event !== "push") {
    return { handled: false, deploys: 0 };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return { handled: false, deploys: 0 };
  }

  const push = parsePushEvent(payload);
  if (!push) return { handled: false, deploys: 0 };

  // Skip branch deletions and tag pushes.
  if (push.deleted) return { handled: true, deploys: 0 };
  const branch = extractBranchFromRef(push.ref);
  if (!branch) return { handled: true, deploys: 0 };

  const pushedRepoKey = parseGitHubRepoKey(push.repository.clone_url);
  if (!pushedRepoKey) return { handled: false, deploys: 0 };

  // Find active projects that track this repo + branch.
  // repoUrl stored as https://github.com/owner/repo (no .git suffix).
  const candidateUrls = [
    `https://github.com/${pushedRepoKey}`,
    `https://github.com/${pushedRepoKey}.git`,
  ];

  const projects = await Project.find({
    repoUrl: { $in: candidateUrls },
    branch,
    status: "active",
  });

  let deploys = 0;
  const commit = push.head_commit
    ? {
        commitSha: push.head_commit.id,
        commitMessage: push.head_commit.message.split("\n")[0] ?? push.head_commit.message,
      }
    : undefined;

  for (const project of projects) {
    try {
      const result = await triggerDeployForProject(project.projectId, commit);
      if (result) deploys++;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "DEPLOYMENT_IN_PROGRESS") continue;
      console.error(`Webhook deploy failed for project ${project.projectId}:`, err);
    }
  }

  return { handled: true, deploys };
}
