import crypto from "node:crypto";

/**
 * Verifies the X-Hub-Signature-256 header GitHub sends with every delivery.
 * Must be called with the raw (unparsed) request body Buffer.
 */
export function verifyGitHubSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export interface GitHubPushEvent {
  ref: string; // "refs/heads/main"
  repository: {
    clone_url: string; // "https://github.com/owner/repo.git"
    html_url: string;
    full_name: string;
  };
  head_commit: { id: string; message: string } | null;
  deleted: boolean;
}

/**
 * Parses and validates the shape of a GitHub push event payload.
 * Returns null if the payload is not a valid push event (e.g. missing fields).
 */
export function parsePushEvent(body: unknown): GitHubPushEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.ref !== "string") return null;
  if (typeof b.repository !== "object" || b.repository === null) return null;
  const repo = b.repository as Record<string, unknown>;
  if (typeof repo.clone_url !== "string") return null;
  if (typeof repo.html_url !== "string") return null;
  if (typeof repo.full_name !== "string") return null;
  return {
    ref: b.ref,
    repository: {
      clone_url: repo.clone_url,
      html_url: repo.html_url,
      full_name: repo.full_name,
    },
    head_commit:
      typeof b.head_commit === "object" && b.head_commit !== null
        ? {
            id: String((b.head_commit as Record<string, unknown>).id ?? ""),
            message: String((b.head_commit as Record<string, unknown>).message ?? ""),
          }
        : null,
    deleted: b.deleted === true,
  };
}

/**
 * Extracts the branch name from a push event ref ("refs/heads/main" → "main").
 * Returns null for tag pushes or other non-branch refs.
 */
export function extractBranchFromRef(ref: string): string | null {
  if (!ref.startsWith("refs/heads/")) return null;
  return ref.slice("refs/heads/".length);
}
