import { describe, expect, test } from "vitest";
import { resolveUniqueSubdomain, slugifyProjectName } from "./subdomain";

describe("slugifyProjectName", () => {
  test("lowercases and hyphenates names", () => {
    expect(slugifyProjectName("My Blog App")).toBe("my-blog-app");
  });

  test("trims invalid edge characters", () => {
    expect(slugifyProjectName("---Hello---")).toBe("hello");
  });

  test("falls back when name has no slug characters", () => {
    expect(slugifyProjectName("!!!")).toBe("app");
  });
});

describe("resolveUniqueSubdomain", () => {
  test("returns base slug when available", async () => {
    const result = await resolveUniqueSubdomain("my-app", async () => false);
    expect(result).toBe("my-app");
  });

  test("appends numeric suffix on collision", async () => {
    const taken = new Set(["my-app", "my-app-2"]);
    const result = await resolveUniqueSubdomain("my-app", async (candidate) =>
      taken.has(candidate),
    );
    expect(result).toBe("my-app-3");
  });
});
