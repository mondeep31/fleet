/**
 * Utilities for normalizing and comparing GitHub repository URLs.
 * Fleet stores repoUrl as https://github.com/owner/repo (no .git suffix).
 * GitHub webhook payloads use repository.clone_url (https://github.com/owner/repo.git).
 * Both forms are reduced to a canonical "owner/repo" key for matching.
 */

const GITHUB_REPO_RE = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i;

/**
 * Returns the "owner/repo" key for a GitHub URL, or null if the URL is not a
 * recognised GitHub repo URL.
 */
export function parseGitHubRepoKey(url: string): string | null {
  const match = url.match(GITHUB_REPO_RE);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

/**
 * Returns "owner/repo" or throws for non-GitHub URLs.
 * Use when you have already validated the URL is GitHub.
 */
export function requireGitHubRepoKey(url: string): string {
  const key = parseGitHubRepoKey(url);
  if (!key) throw new Error(`Not a GitHub repo URL: ${url}`);
  return key;
}

/**
 * Returns true when two repo URLs resolve to the same GitHub owner/repo,
 * regardless of .git suffix, trailing slash, or casing differences.
 */
export function repoUrlsMatch(a: string, b: string): boolean {
  const ka = parseGitHubRepoKey(a);
  const kb = parseGitHubRepoKey(b);
  if (!ka || !kb) return false;
  return ka.toLowerCase() === kb.toLowerCase();
}
