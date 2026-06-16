/**
 * Tests that startDeploy writes the caller-supplied branch to the Deployment
 * document instead of any hardcoded value.
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDeploymentCreate = vi.fn();
const mockEnqueueDeploy = vi.fn();

vi.mock("@fleet/db", () => ({
  Deployment: {
    create: (...args: unknown[]) => mockDeploymentCreate(...args),
  },
  Project: {},
}));

vi.mock("@fleet/queue", () => ({
  enqueueDeploy: (...args: unknown[]) => mockEnqueueDeploy(...args),
  cancelDeployJob: vi.fn(),
}));

vi.mock("@fleet/errors", () => ({
  AppError: class extends Error {
    constructor(
      public status: number,
      message: string,
      public code: string,
    ) {
      super(message);
    }
  },
}));

vi.mock("../lib/containers", () => ({
  getProjectContainerName: vi.fn(),
  removeProjectContainer: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

import { startDeploy } from "./deployment";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("startDeploy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeploymentCreate.mockResolvedValue({
      deploymentId: "deploy-1",
      status: "queued",
    });
    mockEnqueueDeploy.mockResolvedValue(undefined);
  });

  test("persists the supplied branch on the Deployment document", async () => {
    await startDeploy({
      projectId: "proj-1",
      repoUrl: "https://github.com/acme/app",
      branch: "feat/my-feature",
    });

    expect(mockDeploymentCreate).toHaveBeenCalledOnce();
    const [doc] = mockDeploymentCreate.mock.calls[0] as [Record<string, unknown>][];
    expect(doc.branch).toBe("feat/my-feature");
  });

  test("uses 'main' when passed as branch", async () => {
    await startDeploy({
      projectId: "proj-2",
      repoUrl: "https://github.com/acme/app",
      branch: "main",
    });

    const [doc] = mockDeploymentCreate.mock.calls[0] as [Record<string, unknown>][];
    expect(doc.branch).toBe("main");
  });

  test("enqueues the deploy job", async () => {
    await startDeploy({
      projectId: "proj-3",
      repoUrl: "https://github.com/acme/app",
      branch: "develop",
    });

    expect(mockEnqueueDeploy).toHaveBeenCalledOnce();
    const [job] = mockEnqueueDeploy.mock.calls[0] as [Record<string, unknown>][];
    expect(job.projectId).toBe("proj-3");
  });
});
