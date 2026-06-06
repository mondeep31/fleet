import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "vitest";
import { detectDockerfile } from "./detect-dockerfile";

describe("detectDockerfile", () => {
  test("finds Dockerfile at repo root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fleet-detect-"));
    await writeFile(join(dir, "Dockerfile"), "FROM alpine\n");

    const result = await detectDockerfile(dir);

    expect(result).toEqual({
      found: true,
      relativePath: "Dockerfile",
      absolutePath: join(dir, "Dockerfile"),
    });

    await rm(dir, { recursive: true });
  });

  test("finds dockerfile at repo root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fleet-detect-"));
    await writeFile(join(dir, "dockerfile"), "FROM alpine\n");

    const result = await detectDockerfile(dir);

    expect(result).toEqual({
      found: true,
      relativePath: "dockerfile",
      absolutePath: join(dir, "dockerfile"),
    });

    await rm(dir, { recursive: true });
  });

  test("prefers Dockerfile over dockerfile when both exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fleet-detect-"));
    await writeFile(join(dir, "Dockerfile"), "FROM alpine\n");
    await writeFile(join(dir, "dockerfile"), "FROM debian\n");

    const result = await detectDockerfile(dir);

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.relativePath).toBe("Dockerfile");
    }

    await rm(dir, { recursive: true });
  });

  test("returns not found for empty directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fleet-detect-"));

    const result = await detectDockerfile(dir);

    expect(result).toEqual({ found: false });

    await rm(dir, { recursive: true });
  });

  test("ignores Dockerfile in subdirectories", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fleet-detect-"));
    await mkdir(join(dir, "apps", "api"), { recursive: true });
    await writeFile(join(dir, "apps", "api", "Dockerfile"), "FROM alpine\n");

    const result = await detectDockerfile(dir);

    expect(result).toEqual({ found: false });

    await rm(dir, { recursive: true });
  });
});
