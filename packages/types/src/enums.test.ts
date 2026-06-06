import { describe, expect, expectTypeOf, test } from "vitest";
import type {
  DeploymentStatus,
  EnvironmentType,
  RuntimeType,
  ServerStatus,
} from "./enums";

describe("types/enums", () => {
  test("DeploymentStatus allows expected values", () => {
    const values: DeploymentStatus[] = [
      "queued",
      "cloning",
      "cloned",
      "building",
      "deploying",
      "live",
      "failed",
      "rolled_back",
      "stopped",
    ];

    expect(values).toHaveLength(9);
    expect(values).toContain("live");
  });

  test("RuntimeType allows expected values", () => {
    const runtime: RuntimeType = "bun";
    expect(runtime).toBe("bun");
    expectTypeOf<RuntimeType>().toEqualTypeOf<
      "nextjs" | "node" | "bun" | "go" | "rust" | "python" | "docker" | "unknown"
    >();
  });

  test("ServerStatus allows expected values", () => {
    const statuses: ServerStatus[] = ["connected", "disconnected"];
    expect(statuses).toContain("connected");
    expect(statuses).toContain("disconnected");
  });

  test("EnvironmentType allows expected values", () => {
    const types: EnvironmentType[] = ["prod", "staging", "dev"];
    expect(types).toHaveLength(3);
    expectTypeOf<EnvironmentType>().toEqualTypeOf<
      "prod" | "staging" | "dev"
    >();
  });
});
