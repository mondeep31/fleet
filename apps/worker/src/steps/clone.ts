import { dirname } from "node:path";
import fs from "fs-extra";
import simpleGit from "simple-git";
import { getCloneDir } from "../lib/paths";
import { buildAuthenticatedGitHubRepoUrl, redactSecrets } from "../lib/github-repo";

interface CloneRepoParams {
  repoUrl: string;
  deploymentId: string;
  branch: string;
  githubToken?: string;
}

interface CloneRepoResult {
  cloneDir: string;
  commitSha: string;
}

export async function cloneRepo({
  repoUrl,
  deploymentId,
  branch,
  githubToken,
}: CloneRepoParams): Promise<CloneRepoResult> {
  const cloneDir = getCloneDir(deploymentId);

  await fs.ensureDir(dirname(cloneDir));
  if (await fs.pathExists(cloneDir)) {
    await fs.remove(cloneDir);
  }

  const git = simpleGit().env("GIT_TERMINAL_PROMPT", "0");

  const cloneUrl = githubToken
    ? buildAuthenticatedGitHubRepoUrl(repoUrl, githubToken)
    : repoUrl;
  const cloneArgs = ["--branch", branch, "--single-branch"];

  try {
    await git.clone(cloneUrl, cloneDir, cloneArgs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const redacted = githubToken
      ? redactSecrets(message, githubToken, cloneUrl)
      : message;
    throw new Error(redacted);
  }

  const repoGit = simpleGit(cloneDir);
  const commitSha = (await repoGit.revparse(["HEAD"])).trim();

  return { cloneDir, commitSha };
}
