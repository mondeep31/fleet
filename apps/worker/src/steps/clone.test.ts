import { describe, test, expect, vi, beforeEach } from "vitest";

const mockClone = vi.fn().mockResolvedValue(undefined);
const mockRevparse = vi.fn().mockResolvedValue("abc1234def5678  ");
const mockEnv = vi.fn();

vi.mock("simple-git", () => {
  const makeGit = () => {
    const instance = {
      clone: mockClone,
      revparse: mockRevparse,
      env: (...args: unknown[]) => {
        mockEnv(...args);
        return instance;
      },
    };
    return instance;
  };
  return { default: makeGit };
});

vi.mock("fs-extra", () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    pathExists: vi.fn().mockResolvedValue(false),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../lib/paths", () => ({
  getCloneDir: (id: string) => `/tmp/fleet-builds/${id}`,
}));

import { cloneRepo } from "./clone";

describe("cloneRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRevparse.mockResolvedValue("abc1234def5678  ");
  });

  test("clones without auth flags when no githubToken", async () => {
    const result = await cloneRepo({
      repoUrl: "https://github.com/acme/app",
      deploymentId: "dep1",
      branch: "main",
    });

    expect(mockClone).toHaveBeenCalledWith(
      "https://github.com/acme/app",
      "/tmp/fleet-builds/dep1",
      ["--branch", "main", "--single-branch"],
    );
    expect(result.commitSha).toBe("abc1234def5678");
  });

  test("includes Bearer auth header when githubToken is provided", async () => {
    await cloneRepo({
      repoUrl: "https://github.com/acme/private-app",
      deploymentId: "dep2",
      branch: "main",
      githubToken: "ghp_testtoken",
    });

    expect(mockClone).toHaveBeenCalledWith(
      "https://github.com/acme/private-app",
      "/tmp/fleet-builds/dep2",
      [
        "--branch",
        "main",
        "--single-branch",
        "-c",
        "http.extraHeader=Authorization: Bearer ghp_testtoken",
      ],
    );
  });

  test("sets GIT_TERMINAL_PROMPT=0 to prevent interactive prompts", async () => {
    await cloneRepo({
      repoUrl: "https://github.com/acme/app",
      deploymentId: "dep3",
      branch: "main",
    });

    expect(mockEnv).toHaveBeenCalledWith("GIT_TERMINAL_PROMPT", "0");
  });

  test("redacts token from clone error messages", async () => {
    const token = "ghp_secret";
    mockClone.mockRejectedValueOnce(new Error(`fatal: auth failed: token=${token}`));

    await expect(
      cloneRepo({
        repoUrl: "https://github.com/acme/app",
        deploymentId: "dep4",
        branch: "main",
        githubToken: token,
      }),
    ).rejects.toThrow("fatal: auth failed: token=[REDACTED]");
  });
});
