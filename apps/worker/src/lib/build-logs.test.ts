import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../services/logs", () => ({ publishLog: vi.fn() }));

import { publishLog } from "../services/logs";
import { createBuildLogWriter, redactBuildSecrets } from "./build-logs";

afterEach(() => vi.restoreAllMocks());

describe("build log redaction", () => {
  test("masks values split across chunks in console output and deployment logs", () => {
    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    vi.mocked(publishLog).mockClear();
    const writer = createBuildLogWriter("dep1", { API_KEY: "private-token" });
    writer.write("Building...\nAPI_KEY=private-");
    writer.write("token\nlast private-token");
    writer.flush();
    writer.flush();

    expect(stdout.mock.calls.map(([line]) => line).join(""))
      .toBe("Building...\nAPI_KEY=[REDACTED]\nlast [REDACTED]\n");
    expect(vi.mocked(publishLog).mock.calls.map(([, line]) => line)).toEqual([
      "Building...", "API_KEY=[REDACTED]", "last [REDACTED]",
    ]);
  });

  test("masks overlapping and multiline secret values without leaking suffixes", () => {
    expect(redactBuildSecrets("token-long\nline-one\nline-two", {
      SHORT: "token", LONG: "token-long", MULTILINE: "line-one\nline-two", EMPTY: "",
    })).toBe("[REDACTED]\n[REDACTED]");
    expect(redactBuildSecrets("error: line-one", { MULTILINE: "line-one\nline-two" }))
      .toBe("error: [REDACTED]");
  });
});
