import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../lib/railpack", () => ({
  ensureRailpackBin: vi.fn().mockResolvedValue("/fleet/bin/railpack"),
  ensureBuildKit: vi.fn().mockResolvedValue("docker-container://fleet-buildkit"),
}));
vi.mock("../services/logs", () => ({ publishLog: vi.fn(), flushLogs: vi.fn() }));

import { publishLog } from "../services/logs";
import { buildRailpack } from "./build-railpack";

const spawn = vi.fn();
function output(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("Bun", { spawn });
  vi.spyOn(process.stdout, "write").mockReturnValue(true);
  spawn.mockReturnValue({
    stdout: output(["secret=private-", "token\n"]),
    stderr: output(["tail private-token"]),
    exited: Promise.resolve(0),
    kill: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildRailpack", () => {
  test("supplies dashboard env explicitly without letting it replace the build tooling environment", async () => {
    const env = { BACKEND_URL: "https://api.example.com", API_KEY: "private-token", PATH: "/project/bin" };
    await buildRailpack({ cloneDir: "/tmp/source", imageTag: "fleet/proj:dep1", deploymentId: "dep1", env });

    expect(spawn.mock.calls[0]![0]).toEqual([
      "/fleet/bin/railpack", "build", "--name", "fleet/proj:dep1",
      "--env", "BACKEND_URL=https://api.example.com",
      "--env", "API_KEY=private-token",
      "--env", "PATH=/project/bin", "/tmp/source",
    ]);
    expect(spawn.mock.calls[0]![1].env.PATH).toBe(process.env.PATH);
    expect(spawn.mock.calls[0]![1].env.BUILDKIT_HOST).toBe("docker-container://fleet-buildkit");
    const logs = vi.mocked(publishLog).mock.calls.map(([, line]) => line).join("\n");
    expect(logs).not.toContain("private-token");
    expect(logs).toContain("secret=[REDACTED]");
    expect(logs).toContain("tail [REDACTED]");
  });
});
