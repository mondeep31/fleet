import { describe, expect, expectTypeOf, test } from "vitest";
import type {
  AgentToApiMessage,
  ApiToAgentMessage,
  Deployment,
  Environment,
  Project,
  Server,
  User,
} from "./index";

describe("types/models", () => {
  test("User shape matches DB model", () => {
    const user: User = {
      name: "Ada",
      userId: "user_1",
      email: "user@example.com",
      password: "hashed",
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:00:00.000Z",
    };

    expect(user.email).toContain("@");
    expectTypeOf(user.userId).toBeString();
    expectTypeOf(user).toMatchTypeOf<User>();
  });

  test("Project shape matches DB model", () => {
    const project: Project = {
      projectId: "proj_1",
      userId: "user_1",
      name: "fleet-api",
      repoUrl: "https://github.com/example/fleet",
      runtime: "bun",
    };

    const minimal: Project = {
      projectId: "proj_2",
      userId: "user_1",
      name: "fleet-api",
      repoUrl: "https://github.com/example/fleet",
    };

    expect(project.runtime).toBe("bun");
    expect(minimal.runtime).toBeUndefined();
    expectTypeOf(project).toMatchTypeOf<Project>();
  });

  test("Environment shape matches DB model", () => {
    const environment: Environment = {
      environmentId: "env_1",
      projectId: "proj_1",
      type: "prod",
      branch: "main",
      subdomain: "fleet-api",
      autoDeploy: true,
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:00:00.000Z",
    };

    expect(environment.branch).toBe("main");
    expectTypeOf(environment.type).toEqualTypeOf<"prod" | "staging" | "dev">();
    expectTypeOf(environment).toMatchTypeOf<Environment>();
  });

  test("Server shape matches DB model", () => {
    const server: Server = {
      serverId: "srv_1",
      name: "prod-server",
      ip: "10.0.0.12",
      status: "connected",
      totalRam: 16384,
      totalCpu: 8,
      agentToken: "secret-token",
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:00:00.000Z",
    };

    expectTypeOf(server.status).toEqualTypeOf<"connected" | "disconnected">();
    expectTypeOf(server).toMatchTypeOf<Server>();
  });

  test("Deployment shape matches DB model with optional fields", () => {
    const deployment: Deployment = {
      deploymentId: "dep_1",
      projectId: "proj_1",
      environmentId: "env_1",
      commitSha: "abc123",
      commitMessage: "fix: deploy issue",
      branch: "main",
      serverId: "srv_1",
      status: "failed",
      imageTag: "fleet-api:abc123",
      url: "https://fleet-api.example.com",
      error: "container failed health check",
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:03:00.000Z",
    };

    const queued: Deployment = {
      deploymentId: "dep_2",
      projectId: "proj_1",
      environmentId: "env_1",
      commitSha: "def456",
      commitMessage: "feat: initial deploy",
      branch: "develop",
      serverId: "srv_1",
      status: "queued",
      createdAt: "2026-05-11T01:00:00.000Z",
      updatedAt: "2026-05-11T01:00:00.000Z",
    };

    expect(deployment.error).toBeTruthy();
    expect(queued.imageTag).toBeUndefined();
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
