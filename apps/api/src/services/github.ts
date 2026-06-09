import { User } from "@fleet/db";
import { AppError } from "@fleet/errors";

interface ListGitHubReposParams {
  userId: string;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export async function listGitHubRepos({ userId }: ListGitHubReposParams) {
  const user = await User.findOne({ userId });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  if (!user.githubAccessToken) {
    throw new AppError(
      400,
      "Connect GitHub before listing repositories",
      "GITHUB_NOT_CONNECTED",
    );
  }

  const repos: GitHubRepoResponse[] = [];
  let page = 1;

  while (page <= 10) {
    const url = new URL("https://api.github.com/user/repos");
    url.searchParams.set("affiliation", "owner,collaborator,organization_member");
    url.searchParams.set("sort", "updated");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${user.githubAccessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (response.status === 401) {
      throw new AppError(
        401,
        "GitHub authorization expired. Reconnect GitHub.",
        "GITHUB_TOKEN_INVALID",
      );
    }

    if (!response.ok) {
      throw new AppError(
        response.status,
        "Failed to list GitHub repositories",
        "GITHUB_REPOS_FAILED",
      );
    }

    const pageRepos = (await response.json()) as GitHubRepoResponse[];
    repos.push(...pageRepos);

    if (pageRepos.length < 100) break;
    page += 1;
  }

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    sshUrl: repo.ssh_url,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at,
    owner: repo.owner,
  }));
}
