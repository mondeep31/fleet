/**
 * Unit tests for the deploy cutover sequence.
 *
 * Key invariant: after runContainer succeeds, all sibling containers are
 * removed BEFORE the new container is attached to Traefik. This ensures there
 * is never more than one backend for the project URL, eliminating the stale-env
 * round-robin behaviour.
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

// ── Shared call-order tracker ───────────────────────────────────────────────
const callOrder: string[] = [];

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@fleet/db", () => ({
  Project: {
    findOne: vi.fn().mockResolvedValue({
      projectId: "proj1",
      userId: "user-1",
      repoUrl: "https://github.com/test/test",
      subdomain: "depl-fleet-proj1",
    }),
    updateOne: vi.fn().mockResolvedValue({}),
  },
  Integration: {},
}));

vi.mock("@fleet/config", () => ({
  buildProjectDeploySubdomain: (id: string) => `depl-fleet-${id}`,
  getSharedEnv: () => ({ FLEET_APPS_DOMAIN: "localhost:8080" }),
  buildAppUrlFromEnv: (subdomain: string) => `http://${subdomain}.localhost:8080`,
}));

vi.mock("@fleet/errors", () => ({
  getErrorMessage: (err: unknown) => String(err),
}));

vi.mock("@fleet/queue", () => ({}));

vi.mock("@fleet/runtime-detector", () => ({
  detectDockerfile: vi.fn().mockResolvedValue({ found: true, relativePath: "Dockerfile" }),
}));

vi.mock("../errors/deployment-stopped", () => ({
  DeploymentStoppedError: class DeploymentStoppedError extends Error {
    constructor(id: string) { super(id); }
  },
}));

vi.mock("../services/deployment", () => ({
  getDeployment: vi.fn().mockResolvedValue({
    deploymentId: "dep1",
    projectId: "proj1",
    branch: "main",
  }),
  isDeploymentStopped: vi.fn().mockResolvedValue(false),
  markDeploymentFailed: vi.fn().mockResolvedValue({}),
  supersedeLiveDeployments: vi.fn().mockImplementation(async () => {
    callOrder.push("supersedeLive");
  }),
  updateDeployment: vi.fn().mockResolvedValue({}),
}));

vi.mock("../services/logs", () => ({
  publishLog: vi.fn(),
  finalizeDeploymentLogs: vi.fn().mockResolvedValue({}),
  flushLogs: vi.fn().mockResolvedValue({}),
}));

vi.mock("../services/project-variable", () => ({
  getDecryptedProjectVariables: vi.fn().mockResolvedValue({ FOO: "bar" }),
}));

vi.mock("../services/github-integration", () => ({
  getDecryptedGitHubToken: vi.fn().mockResolvedValue("ghp_test_token"),
}));

vi.mock("../lib/github-repo", () => ({
  isGitHubRepoUrl: vi.fn().mockReturnValue(false),
  redactSecrets: vi.fn((msg: string) => msg),
}));

vi.mock("../steps/clone", () => ({
  cloneRepo: vi.fn().mockResolvedValue({ cloneDir: "/tmp/test", commitSha: "abc1234" }),
}));

vi.mock("../steps/build", () => ({
  buildImage: vi.fn().mockResolvedValue(undefined),
}));

const mockRemoveAllProjectContainers = vi.fn().mockImplementation(async () => {
  callOrder.push("removeAll");
});
const mockAttachContainerToTraefik = vi.fn().mockImplementation(async () => {
  callOrder.push("attachTraefik");
});
const mockRemoveContainerById = vi.fn().mockResolvedValue(undefined);

vi.mock("../lib/docker", () => ({
  removeAllProjectContainers: (...args: unknown[]) =>
    mockRemoveAllProjectContainers(...args),
  attachContainerToTraefik: (...args: unknown[]) =>
    mockAttachContainerToTraefik(...args),
  removeContainerById: (...args: unknown[]) =>
    mockRemoveContainerById(...args),
  // Not used by deploy.ts but exported from the module
  getProjectContainerName: (id: string) => `fleet-project-${id}`,
  getDeploymentContainerName: (p: string, d: string) => `fleet-project-${p}-${d}`,
}));

const NEW_CONTAINER_ID = "new-container-id-abc";

vi.mock("../steps/run", () => ({
  runContainer: vi.fn().mockImplementation(async () => {
    callOrder.push("runContainer");
    return {
      containerId: NEW_CONTAINER_ID,
      networkName: "fleet-project-proj1",
      url: "http://depl-fleet-proj1.localhost:8080",
    };
  }),
}));

// ── Subject ──────────────────────────────────────────────────────────────────

import { handleDeployJob } from "./deploy";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("handleDeployJob — cutover sequence", () => {
  beforeEach(() => {
    callOrder.length = 0;
    vi.clearAllMocks();
    // Re-attach implementations after clearAllMocks (they are cleared too).
    mockRemoveAllProjectContainers.mockImplementation(async () => {
      callOrder.push("removeAll");
    });
    mockAttachContainerToTraefik.mockImplementation(async () => {
      callOrder.push("attachTraefik");
    });
  });

  test("removeAllProjectContainers is called before attachContainerToTraefik", async () => {
    await handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" });

    const removeIdx = callOrder.indexOf("removeAll");
    const attachIdx = callOrder.indexOf("attachTraefik");
    expect(removeIdx).toBeGreaterThanOrEqual(0);
    expect(attachIdx).toBeGreaterThanOrEqual(0);
    expect(removeIdx).toBeLessThan(attachIdx);
  });

  test("removeAllProjectContainers is called with the new container ID as the exclusion", async () => {
    await handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" });

    expect(mockRemoveAllProjectContainers).toHaveBeenCalledWith("proj1", NEW_CONTAINER_ID);
  });

  test("attachContainerToTraefik is called with the new container ID", async () => {
    await handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" });

    expect(mockAttachContainerToTraefik).toHaveBeenCalledWith(NEW_CONTAINER_ID);
  });

  test("on runContainer failure, removeContainerById is NOT called (no orphan to clean)", async () => {
    const { runContainer } = await import("../steps/run");
    vi.mocked(runContainer).mockRejectedValueOnce(new Error("container start failed"));

    await expect(
      handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" }),
    ).rejects.toThrow("container start failed");

    // newContainerId was never set, so cleanup should not run
    expect(mockRemoveContainerById).not.toHaveBeenCalled();
    // Traefik should never have been touched
    expect(mockAttachContainerToTraefik).not.toHaveBeenCalled();
  });

  test("on cutover failure after runContainer, orphan container is removed", async () => {
    mockRemoveAllProjectContainers.mockRejectedValueOnce(new Error("cleanup failed"));

    await expect(
      handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" }),
    ).rejects.toThrow("cleanup failed");

    expect(mockRemoveContainerById).toHaveBeenCalledWith(NEW_CONTAINER_ID);
    // Traefik attach must not have been reached
    expect(mockAttachContainerToTraefik).not.toHaveBeenCalled();
  });
});
