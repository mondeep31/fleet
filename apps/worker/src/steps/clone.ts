import { dirname } from "node:path";
import fs from "fs-extra";
import simpleGit from "simple-git";
import { getCloneDir } from "../lib/paths";

interface CloneRepoParams {
  repoUrl: string;
  deploymentId: string;
  branch: string;
}

interface CloneRepoResult {
  cloneDir: string;
  commitSha: string;
}

export async function cloneRepo({
  repoUrl,
  deploymentId,
  branch,
}: CloneRepoParams): Promise<CloneRepoResult> {
  const cloneDir = getCloneDir(deploymentId);

  await fs.ensureDir(dirname(cloneDir));
  if (await fs.pathExists(cloneDir)) {
    await fs.remove(cloneDir);
  }

  const git = simpleGit();
  await git.clone(repoUrl, cloneDir, ["--branch", branch, "--single-branch"]);

  const repoGit = simpleGit(cloneDir);
  const commitSha = (await repoGit.revparse(["HEAD"])).trim();

  return { cloneDir, commitSha };
}
