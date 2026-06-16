const GITHUB_HOST_PATTERN = /github\.com/;

export function isGitHubRepoUrl(repoUrl: string): boolean {
  try {
    const { hostname } = new URL(repoUrl);
    return GITHUB_HOST_PATTERN.test(hostname);
  } catch {
    return false;
  }
}

export function redactSecrets(message: string, ...secrets: string[]): string {
  let result = message;
  for (const secret of secrets) {
    if (secret) {
      result = result.replaceAll(secret, "[REDACTED]");
    }
  }
  return result;
}
