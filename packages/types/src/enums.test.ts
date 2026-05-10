import { describe, expect, expectTypeOf, test } from "vitest";
import type { DeploymentStatus, RuntimeType, ServerStatus } from "./enums";

describe("types/enums", () => {
  test("DeploymentStatus allows expected values", () => {
    const values: DeploymentStatus[] = [
      "queued",
      "building",
      "deploying",
      "live",
      "failed",
      "rolled_back",
    ];

    expect(values).toHaveLength(6);
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
});
