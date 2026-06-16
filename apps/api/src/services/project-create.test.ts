/**
 * Tests for the project create service:
 * - branch is persisted on the Project document
 * - create is blocked (400) when GitHub repo validation fails
 * - non-GitHub repos skip validation
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockProjectCreate = vi.fn();
const mockValidateRepoDockerfile = vi.fn();
const mockSaveProjectVariables = vi.fn();

vi.mock("@fleet/db", () => ({
  Project: {
    create: (...args: unknown[]) => mockProjectCreate(...args),
    find: vi.fn().mockReturnValue({ lean: () => Promise.resolve([]) }),
  },
}));

vi.mock("@fleet/config", () => ({
  buildProjectDeploySubdomain: (id: string) => `depl-fleet-${id}`,
  getSharedEnv: () => ({ FLEET_SECRETS_ENCRYPTION_KEY: "a".repeat(44) }),
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

// Mock the dockerfile validation in github-repos service
vi.mock("./github-repos", () => ({
  validateRepoDockerfile: (...args: unknown[]) => mockValidateRepoDockerfile(...args),
}));

// Stub out deployment and variable side effects
vi.mock("./deployment", () => ({
  startDeploy: vi.fn().mockResolvedValue({ deploymentId: "d1", status: "queued" }),
  listDeploymentsByProjectId: vi.fn().mockResolvedValue([]),
  stopDeployment: vi.fn(),
}));

vi.mock("./project-variable", () => ({
  saveProjectVariables: (...args: unknown[]) => mockSaveProjectVariables(...args),
}));

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

import { createProject } from "./project";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createProject", () => {
  const BASE = {
    name: "my-app",
    repoUrl: "https://github.com/acme/app",
    branch: "feat/new-ui",
    userId: "user-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectCreate.mockImplementation((doc: Record<string, unknown>) =>
      Promise.resolve({
        projectId: "proj-abc",
        name: doc.name,
        repoUrl: doc.repoUrl,
        branch: doc.branch,
        userId: doc.userId,
        subdomain: doc.subdomain,
        status: "active",
      }),
    );
    mockValidateRepoDockerfile.mockResolvedValue({
      ok: true,
      buildMethod: "dockerfile",
      dockerfilePath: "Dockerfile",
    });
  });

  test("persists the supplied branch on the Project document", async () => {
    const project = await createProject(BASE);
    const [doc] = mockProjectCreate.mock.calls[0] as [Record<string, unknown>][];
    expect(doc.branch).toBe("feat/new-ui");
    expect(project.branch).toBe("feat/new-ui");
  });

  test("returns projectId (not id) for downstream deploy kickoff", async () => {
    const project = await createProject(BASE);
    expect(project.projectId).toBe("proj-abc");
    expect("id" in project).toBe(false);
  });

  test("allows create when no Dockerfile (railpack fallback)", async () => {
    mockValidateRepoDockerfile.mockResolvedValue({
      ok: true,
      buildMethod: "railpack",
    });

    const project = await createProject(BASE);
    expect(project.projectId).toBe("proj-abc");
    expect(mockProjectCreate).toHaveBeenCalled();
  });

  test("blocks create with AppError when GitHub validation fails", async () => {
    mockValidateRepoDockerfile.mockResolvedValue({
      ok: false,
      reason: "GitHub API error 403: rate limit exceeded",
    });

    await expect(createProject(BASE)).rejects.toMatchObject({
      status: 400,
      code: "REPO_VALIDATION_FAILED",
    });
  });

  test("skips Dockerfile check for non-GitHub repo URLs", async () => {
    const project = await createProject({
      ...BASE,
      repoUrl: "https://gitlab.com/acme/app",
    });
    expect(mockValidateRepoDockerfile).not.toHaveBeenCalled();
    expect(project.repoUrl).toBe("https://gitlab.com/acme/app");
  });

  test("calls validateRepoDockerfile with correct owner/repo/branch", async () => {
    await createProject(BASE);
    expect(mockValidateRepoDockerfile).toHaveBeenCalledWith(
      "user-1",
      "acme",
      "app",
      "feat/new-ui",
    );
  });
});
