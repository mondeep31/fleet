import { describe, expect, expectTypeOf, test } from "vitest";
import type { AgentToApiMessage, ApiToAgentMessage } from "./agent";

describe("types/agent", () => {
  test("ApiToAgentMessage deploy variant", () => {
    const message: ApiToAgentMessage = {
      type: "deploy",
      deploymentId: "dep_1",
      repoUrl: "https://github.com/example/fleet",
      imageTag: "fleet-api:abc123",
      networkName: "fleet-net",
      subdomain: "fleet-api",
      env: { NODE_ENV: "production" },
    };

    expect(message.type).toBe("deploy");
    expectTypeOf(message.env).toEqualTypeOf<Record<string, string>>();
  });

  test("ApiToAgentMessage stop/rollback variants", () => {
    const stopMessage: ApiToAgentMessage = {
      type: "stop",
      containerId: "container_1",
      deploymentId: "dep_1",
    };

    const rollbackMessage: ApiToAgentMessage = {
      type: "rollback",
      deploymentId: "dep_2",
      imageTag: "fleet-api:prev",
      networkName: "fleet-net",
      subdomain: "fleet-api",
    };

    expect(stopMessage.type).toBe("stop");
    expect(rollbackMessage.type).toBe("rollback");
  });

  test("AgentToApiMessage variants", () => {
    const logMessage: AgentToApiMessage = {
      type: "log",
      deploymentId: "dep_1",
      line: "build completed",
      stream: "stdout",
      timestamp: "2026-05-11T00:00:00.000Z",
    };

    const statusMessage: AgentToApiMessage = {
      type: "status",
      deploymentId: "dep_1",
      status: "building",
    };

    const registerMessage: AgentToApiMessage = {
      type: "register",
      agentToken: "agent-token",
      ip: "127.0.0.1",
      totalRam: 8192,
      totalCpu: 4,
    };

    expect(logMessage.stream).toBe("stdout");
    expect(statusMessage.status).toBe("building");
    expect(registerMessage.totalCpu).toBe(4);
  });
});
