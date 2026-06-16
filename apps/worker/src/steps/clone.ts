import { dirname } from "node:path";
import fs from "fs-extra";
import simpleGit from "simple-git";
import { getCloneDir } from "../lib/paths";
import { redactSecrets } from "../lib/github-repo";

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

  const cloneArgs = ["--branch", branch, "--single-branch"];
  if (githubToken) {
    cloneArgs.push("-c", `http.extraHeader=Authorization: Bearer ${githubToken}`);
  }

  try {
    await git.clone(repoUrl, cloneDir, cloneArgs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const redacted = githubToken ? redactSecrets(message, githubToken) : message;
    throw new Error(redacted);
  }

  const repoGit = simpleGit(cloneDir);
  const commitSha = (await repoGit.revparse(["HEAD"])).trim();

  return { cloneDir, commitSha };
}
