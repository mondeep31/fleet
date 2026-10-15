export const GITHUB_CONNECTION_CHANNEL = "fleet-github-connection";
export const GITHUB_CONNECTION_MESSAGE = "fleet:github:complete";

export type GitHubConnectionResult = "connected" | "error" | "approval_required" | "installation_required";

export function githubConnectionResult(value: unknown): GitHubConnectionResult {
  return value === "connected" || value === "approval_required" || value === "installation_required" ? value : "error";
}

export function isGitHubConnectionMessage(value: unknown): value is { type: typeof GITHUB_CONNECTION_MESSAGE; result: GitHubConnectionResult } {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return message.type === GITHUB_CONNECTION_MESSAGE
    && ["connected", "error", "approval_required", "installation_required"].includes(message.result as string);
}
