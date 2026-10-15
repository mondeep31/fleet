import {
  listRepos,
  listAppRepos,
  searchRepos,
  getRepo,
  listBranches,
  getRootDockerfile,
  type DockerfileCheckResult,
} from "../lib/github-client";
import { getDecryptedGitHubToken, getGitHubConnection } from "./github-integration";

export async function listUserRepos(
  userId: string,
  page = 1,
  perPage = 30,
  q?: string,
) {
  const { token, authType } = await getGitHubConnection(userId);
  if (authType === "app") return listAppRepos(token, page, perPage, q);
  if (q && q.trim().length > 0) {
    return searchRepos(token, q.trim(), page, perPage);
  }
  return listRepos(token, page, perPage);
}

export async function getRepoMetadata(
  userId: string,
  owner: string,
  repo: string,
) {
  const token = await getDecryptedGitHubToken(userId, `${owner}/${repo}`);
  return getRepo(token, owner, repo);
}

export async function listRepoBranches(
  userId: string,
  owner: string,
  repo: string,
  page = 1,
  perPage = 100,
) {
  const token = await getDecryptedGitHubToken(userId, `${owner}/${repo}`);
  return listBranches(token, owner, repo, page, perPage);
}

export async function validateRepoDockerfile(
  userId: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<DockerfileCheckResult> {
  const token = await getDecryptedGitHubToken(userId, `${owner}/${repo}`);
  return getRootDockerfile(token, owner, repo, branch);
}
