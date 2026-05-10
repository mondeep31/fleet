import { describe, expect, expectTypeOf, test } from "vitest";
import type {
  AgentToApiMessage,
  ApiToAgentMessage,
  Deployment,
  Project,
  Server,
  User,
} from "./index";

describe("types/models", () => {
  test("User shape composes correctly", () => {
    const user: User = {
      id: "user_1",
      email: "user@example.com",
      createdAt: "2026-05-11T00:00:00.000Z",
    };

    expect(user.email).toContain("@");
    expectTypeOf(user).toMatchTypeOf<User>();
  });

  test("Server and Project shapes accept valid runtime/status fields", () => {
    const server: Server = {
      id: "srv_1",
      userId: "user_1",
      name: "prod-server",
      ip: "10.0.0.12",
      status: "connected",
      totalRam: 16384,
      totalCpu: 8,
      createdAt: "2026-05-11T00:00:00.000Z",
    };

    const project: Project = {
      id: "proj_1",
      userId: "user_1",
      serverId: server.id,
      name: "fleet-api",
      repoUrl: "https://github.com/example/fleet",
      branch: "main",
      subdomain: "fleet-api",
      runtime: "bun",
      createdAt: "2026-05-11T00:00:00.000Z",
    };

    expect(project.serverId).toBe(server.id);
    expectTypeOf(server.status).toEqualTypeOf<"connected" | "disconnected">();
  });

  test("Deployment supports optional error field", () => {
    const deployment: Deployment = {
      id: "dep_1",
      projectId: "proj_1",
      status: "failed",
      commitSha: "abc123",
      commitMessage: "fix: deploy issue",
      imageTag: "fleet-api:abc123",
      error: "container failed health check",
      queuedAt: "2026-05-11T00:00:00.000Z",
      buildingAt: "2026-05-11T00:01:00.000Z",
      deployingAt: "2026-05-11T00:02:00.000Z",
      liveAt: "2026-05-11T00:00:00.000Z",
      failedAt: "2026-05-11T00:03:00.000Z",
    };

    expect(deployment.error).toBeTruthy();
    expectTypeOf(deployment.status).toEqualTypeOf<
      "queued" | "building" | "deploying" | "live" | "failed" | "rolled_back"
    >();
  });

  test("Agent message unions support valid variants", () => {
    const deployMsg: ApiToAgentMessage = {
      type: "deploy",
      deploymentId: "dep_1",
      repoUrl: "https://github.com/example/fleet",
      imageTag: "fleet-api:abc123",
      networkName: "fleet-net",
      subdomain: "fleet-api",
      env: { NODE_ENV: "production" },
    };

    const statusMsg: AgentToApiMessage = {
      type: "status",
      deploymentId: "dep_1",
      status: "live",
    };

    expect(deployMsg.type).toBe("deploy");
    expect(statusMsg.type).toBe("status");
    expectTypeOf(deployMsg).toMatchTypeOf<ApiToAgentMessage>();
    expectTypeOf(statusMsg).toMatchTypeOf<AgentToApiMessage>();
  });
});
