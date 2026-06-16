import { describe, test, expect } from "vitest";
import {
  buildAuthenticatedGitHubRepoUrl,
  isGitHubRepoUrl,
  redactSecrets,
} from "./github-repo";

describe("isGitHubRepoUrl", () => {
  test("returns true for https github.com URL", () => {
    expect(isGitHubRepoUrl("https://github.com/acme/app")).toBe(true);
  });

  test("returns true for https github.com URL with .git suffix", () => {
    expect(isGitHubRepoUrl("https://github.com/acme/app.git")).toBe(true);
  });

  test("returns false for non-github URL", () => {
    expect(isGitHubRepoUrl("https://gitlab.com/acme/app")).toBe(false);
  });

  test("returns false for bitbucket URL", () => {
    expect(isGitHubRepoUrl("https://bitbucket.org/acme/app")).toBe(false);
  });

  test("returns false for an invalid URL", () => {
    expect(isGitHubRepoUrl("not-a-url")).toBe(false);
  });
});

describe("buildAuthenticatedGitHubRepoUrl", () => {
  test("embeds token as x-access-token userinfo", () => {
    expect(
      buildAuthenticatedGitHubRepoUrl("https://github.com/acme/app", "ghp_secret"),
    ).toBe("https://x-access-token:ghp_secret@github.com/acme/app");
  });

  test("preserves .git suffix and path", () => {
    expect(
      buildAuthenticatedGitHubRepoUrl(
        "https://github.com/acme/app.git",
        "ghp_secret",
      ),
    ).toBe("https://x-access-token:ghp_secret@github.com/acme/app.git");
  });
});

describe("redactSecrets", () => {
  test("replaces a token in an error message", () => {
    const token = "ghp_supersecret";
    const message = `fatal: could not read Username for '${token}@github.com'`;
    expect(redactSecrets(message, token)).toBe(
      "fatal: could not read Username for '[REDACTED]@github.com'",
    );
  });

  test("replaces all occurrences of a secret", () => {
    const token = "abc123";
    const message = `token=${token} header=Bearer ${token}`;
    expect(redactSecrets(message, token)).toBe("token=[REDACTED] header=Bearer [REDACTED]");
  });

  test("handles multiple secrets", () => {
    const message = "token1 and token2 are both bad";
    expect(redactSecrets(message, "token1", "token2")).toBe(
      "[REDACTED] and [REDACTED] are both bad",
    );
  });

  test("returns message unchanged when no secrets provided", () => {
    const message = "some error message";
    expect(redactSecrets(message)).toBe("some error message");
  });
});
