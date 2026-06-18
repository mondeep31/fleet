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
  User: {
    findOne: vi.fn().mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ plan: "free" }),
      }),
    }),
  },
}));

vi.mock("@fleet/config", () => ({
  buildProjectDeploySubdomain: (id: string) => `depl-fleet-${id}`,
  getSharedEnv: () => ({ FLEET_APPS_DOMAIN: "localhost:8080" }),
  buildAppUrlFromEnv: (subdomain: string) => `http://${subdomain}.localhost:8080`,
  isUnlimitedPlan: (limits: { unlimited?: boolean }) => limits.unlimited === true,
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

vi.mock("../services/user-plan", () => ({
  getComputeLimitsForUser: vi.fn().mockResolvedValue({
    memoryMb: 256,
    nanoCpus: 250_000_000,
    pidsLimit: 128,
    tmpfsMb: 32,
  }),
}));

vi.mock("../services/github-integration", () => ({
  getDecryptedGitHubToken: vi.fn().mockResolvedValue("ghp_test_token"),
}));

vi.mock("../lib/github-repo", () => ({
  isGitHubRepoUrl: vi.fn().mockReturnValue(false),
  redactSecrets: vi.fn((msg: string) => msg),
}));

vi.mock("../steps/clone", () => ({
  cloneRepo: vi.fn().mockResolvedValue({ cloneDir: "/tmp/test", commitSha: "abc1234", commitMessage: "test commit" }),
}));

vi.mock("../steps/build", () => ({
  buildImage: vi.fn().mockResolvedValue(undefined),
}));

const mockRemoveAllProjectContainers = vi.fn().mockImplementation(async () => {
  callOrder.push("removeAll");
});
const mockEnsureTraefikOnProjectNetwork = vi.fn().mockImplementation(async () => {
  callOrder.push("ensureTraefik");
});
const mockRemoveContainerById = vi.fn().mockResolvedValue(undefined);

vi.mock("../lib/docker", () => ({
  removeAllProjectContainers: (...args: unknown[]) =>
    mockRemoveAllProjectContainers(...args),
  ensureTraefikOnProjectNetwork: (...args: unknown[]) =>
    mockEnsureTraefikOnProjectNetwork(...args),
  removeContainerById: (...args: unknown[]) =>
    mockRemoveContainerById(...args),
  // Not used by deploy.ts but exported from the module
  getProjectContainerName: (id: string) => `fleet-project-${id}`,
  getDeploymentContainerName: (p: string, d: string) => `fleet-project-${p}-${d}`,
}));

const NEW_CONTAINER_ID = "new-container-id-abc";

const mockRunContainer = vi.fn().mockImplementation(async () => {
  callOrder.push("runContainer");
  return {
    containerId: NEW_CONTAINER_ID,
    networkName: "fleet-project-proj1",
    url: "http://depl-fleet-proj1.localhost:8080",
  };
});

vi.mock("../steps/run", () => ({
  runContainer: (...args: unknown[]) => mockRunContainer(...args),
}));

// ── Subject ──────────────────────────────────────────────────────────────────

import { handleDeployJob } from "./deploy";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("handleDeployJob — cutover sequence", () => {
  beforeEach(() => {
    callOrder.length = 0;
    vi.clearAllMocks();
    mockRemoveAllProjectContainers.mockImplementation(async () => {
      callOrder.push("removeAll");
    });
    mockEnsureTraefikOnProjectNetwork.mockImplementation(async () => {
      callOrder.push("ensureTraefik");
    });
    mockRunContainer.mockImplementation(async () => {
      callOrder.push("runContainer");
      return {
        containerId: NEW_CONTAINER_ID,
        networkName: "fleet-project-proj1",
        url: "http://depl-fleet-proj1.localhost:8080",
      };
    });
  });

  test("removeAllProjectContainers is called before ensureTraefikOnProjectNetwork", async () => {
    await handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" });

    const removeIdx = callOrder.indexOf("removeAll");
    const traefikIdx = callOrder.indexOf("ensureTraefik");
    expect(removeIdx).toBeGreaterThanOrEqual(0);
    expect(traefikIdx).toBeGreaterThanOrEqual(0);
    expect(removeIdx).toBeLessThan(traefikIdx);
  });

  test("removeAllProjectContainers is called with the new container ID as the exclusion", async () => {
    await handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" });

    expect(mockRemoveAllProjectContainers).toHaveBeenCalledWith("proj1", NEW_CONTAINER_ID);
  });

  test("ensureTraefikOnProjectNetwork is called with the project network name", async () => {
    await handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" });

    expect(mockEnsureTraefikOnProjectNetwork).toHaveBeenCalledWith(
      "fleet-project-proj1",
    );
  });

  test("on runContainer failure, removeContainerById is NOT called (no orphan to clean)", async () => {
    mockRunContainer.mockRejectedValueOnce(new Error("container start failed"));

    await expect(
      handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" }),
    ).rejects.toThrow("container start failed");

    // newContainerId was never set, so cleanup should not run
    expect(mockRemoveContainerById).not.toHaveBeenCalled();
    // Traefik should never have been touched
    expect(mockEnsureTraefikOnProjectNetwork).not.toHaveBeenCalled();
  });

  test("on cutover failure after runContainer, orphan container is removed", async () => {
    mockRemoveAllProjectContainers.mockRejectedValueOnce(new Error("cleanup failed"));

    await expect(
      handleDeployJob({ deploymentId: "dep1", projectId: "proj1", repoUrl: "https://g.com/r" }),
    ).rejects.toThrow("cleanup failed");

    expect(mockRemoveContainerById).toHaveBeenCalledWith(NEW_CONTAINER_ID);
    // Traefik attach must not have been reached
    expect(mockEnsureTraefikOnProjectNetwork).not.toHaveBeenCalled();
  });
});
