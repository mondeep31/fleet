export function isGitHubRepoUrl(repoUrl: string): boolean {
  try {
    const { hostname } = new URL(repoUrl);
    return hostname === "github.com";
  } catch {
    return false;
  }
}

export function buildAuthenticatedGitHubRepoUrl(
  repoUrl: string,
  token: string,
): string {
  const url = new URL(repoUrl);
  url.username = "x-access-token";
  url.password = token;
  return url.toString();
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
