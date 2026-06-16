import { describe, test, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockProjectFind = vi.fn();
const mockTriggerDeployForProject = vi.fn();

vi.mock("@fleet/db", () => ({
  Project: {
    find: (...args: unknown[]) => mockProjectFind(...args),
    findOne: vi.fn(),
  },
}));

vi.mock("./project", () => ({
  triggerDeployForProject: (...args: unknown[]) => mockTriggerDeployForProject(...args),
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

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

import { handleGitHubWebhookDelivery } from "./github-webhook";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pushBody(overrides?: Record<string, unknown>): Buffer {
  return Buffer.from(
    JSON.stringify({
      ref: "refs/heads/main",
      repository: {
        clone_url: "https://github.com/acme/app.git",
        html_url: "https://github.com/acme/app",
        full_name: "acme/app",
      },
      head_commit: { id: "abc123", message: "fix bug" },
      deleted: false,
      ...overrides,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleGitHubWebhookDelivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectFind.mockResolvedValue([]);
  });

  test("ping event returns handled=true with no deploys", async () => {
    const result = await handleGitHubWebhookDelivery("ping", Buffer.from("{}"));
    expect(result).toEqual({ handled: true, deploys: 0 });
    expect(mockProjectFind).not.toHaveBeenCalled();
  });

  test("unrecognised event returns handled=false", async () => {
    const result = await handleGitHubWebhookDelivery("pull_request", Buffer.from("{}"));
    expect(result).toEqual({ handled: false, deploys: 0 });
  });

  test("push on matching branch triggers deploy", async () => {
    mockProjectFind.mockResolvedValue([{ projectId: "proj-1" }]);
    mockTriggerDeployForProject.mockResolvedValue({ deploymentId: "d1", status: "queued" });

    const result = await handleGitHubWebhookDelivery("push", pushBody());
    expect(result).toEqual({ handled: true, deploys: 1 });
    expect(mockTriggerDeployForProject).toHaveBeenCalledWith("proj-1", {
      commitSha: "abc123",
      commitMessage: "fix bug",
    });
  });

  test("push on different branch finds no projects (query uses branch)", async () => {
    mockProjectFind.mockResolvedValue([]);
    const result = await handleGitHubWebhookDelivery("push", pushBody({ ref: "refs/heads/dev" }));
    expect(result).toEqual({ handled: true, deploys: 0 });
  });

  test("branch delete push is ignored", async () => {
    const result = await handleGitHubWebhookDelivery(
      "push",
      pushBody({ deleted: true, head_commit: null }),
    );
    expect(result).toEqual({ handled: true, deploys: 0 });
    expect(mockProjectFind).not.toHaveBeenCalled();
  });

  test("tag push is ignored (non-heads ref)", async () => {
    const result = await handleGitHubWebhookDelivery(
      "push",
      pushBody({ ref: "refs/tags/v1.0.0" }),
    );
    expect(result).toEqual({ handled: true, deploys: 0 });
    expect(mockProjectFind).not.toHaveBeenCalled();
  });

  test("in-progress deploy is swallowed without counting", async () => {
    mockProjectFind.mockResolvedValue([{ projectId: "proj-1" }]);
    const err = Object.assign(new Error("in progress"), { code: "DEPLOYMENT_IN_PROGRESS" });
    mockTriggerDeployForProject.mockRejectedValue(err);

    const result = await handleGitHubWebhookDelivery("push", pushBody());
    expect(result).toEqual({ handled: true, deploys: 0 });
  });

  test("deploys multiple matching projects", async () => {
    mockProjectFind.mockResolvedValue([
      { projectId: "proj-1" },
      { projectId: "proj-2" },
    ]);
    mockTriggerDeployForProject.mockResolvedValue({ deploymentId: "d1", status: "queued" });

    const result = await handleGitHubWebhookDelivery("push", pushBody());
    expect(result).toEqual({ handled: true, deploys: 2 });
  });
});
