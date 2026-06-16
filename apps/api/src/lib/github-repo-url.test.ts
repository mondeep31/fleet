import { describe, test, expect } from "vitest";
import { parseGitHubRepoKey, requireGitHubRepoKey, repoUrlsMatch } from "./github-repo-url";

describe("parseGitHubRepoKey", () => {
  test("handles standard URL", () => {
    expect(parseGitHubRepoKey("https://github.com/acme/app")).toBe("acme/app");
  });

  test("strips .git suffix", () => {
    expect(parseGitHubRepoKey("https://github.com/acme/app.git")).toBe("acme/app");
  });

  test("strips trailing slash", () => {
    expect(parseGitHubRepoKey("https://github.com/acme/app/")).toBe("acme/app");
  });

  test("handles mixed case", () => {
    expect(parseGitHubRepoKey("https://github.com/Acme/App")).toBe("Acme/App");
  });

  test("returns null for non-GitHub URL", () => {
    expect(parseGitHubRepoKey("https://gitlab.com/acme/app")).toBeNull();
  });

  test("returns null for invalid URL", () => {
    expect(parseGitHubRepoKey("not-a-url")).toBeNull();
  });
});

describe("requireGitHubRepoKey", () => {
  test("returns key for valid URL", () => {
    expect(requireGitHubRepoKey("https://github.com/acme/app")).toBe("acme/app");
  });

  test("throws for non-GitHub URL", () => {
    expect(() => requireGitHubRepoKey("https://gitlab.com/acme/app")).toThrow();
  });
});

describe("repoUrlsMatch", () => {
  test("matches clone_url vs stored URL", () => {
    expect(
      repoUrlsMatch(
        "https://github.com/acme/app.git",
        "https://github.com/acme/app",
      ),
    ).toBe(true);
  });

  test("case-insensitive match", () => {
    expect(
      repoUrlsMatch(
        "https://github.com/Acme/App",
        "https://github.com/acme/app",
      ),
    ).toBe(true);
  });

  test("does not match different repos", () => {
    expect(
      repoUrlsMatch(
        "https://github.com/acme/app",
        "https://github.com/acme/other",
      ),
    ).toBe(false);
  });

  test("returns false when either URL is not GitHub", () => {
    expect(
      repoUrlsMatch("https://gitlab.com/acme/app", "https://github.com/acme/app"),
    ).toBe(false);
  });
});
