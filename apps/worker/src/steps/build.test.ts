import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import Docker from "dockerode";
import tar from "tar-fs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDocker: vi.fn(), publishLog: vi.fn(), flushLogs: vi.fn() }));
vi.mock("../lib/docker", () => ({ getDocker: mocks.getDocker }));
vi.mock("../services/logs", () => ({ publishLog: mocks.publishLog, flushLogs: mocks.flushLogs }));

import { buildImage } from "./build";

let cloneDir: string;
let docker: Docker;

beforeEach(async () => {
  vi.clearAllMocks();
  cloneDir = await mkdtemp(join(tmpdir(), "fleet-build-test-"));
  await writeFile(join(cloneDir, "Dockerfile"), "FROM node:22-alpine\nARG BACKEND_URL\nARG NEXT_PUBLIC_FLAG\n");
  docker = new Docker();
  mocks.getDocker.mockReturnValue(docker);
  vi.spyOn(docker.modem, "followProgress").mockImplementation((_stream, done) => done(null, []));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(cloneDir, { recursive: true, force: true });
});

describe("buildImage", () => {
  test("passes declared dashboard args and excludes .dockerignore matches and Git credentials from the archive", async () => {
    await mkdir(join(cloneDir, ".git"));
    await writeFile(join(cloneDir, ".git/config"), "https://token@github.com/test/repo");
    await mkdir(join(cloneDir, "iddp-portal"));
    await writeFile(join(cloneDir, "iddp-portal/.env"), "PRIVATE_KEY=secret");
    await writeFile(join(cloneDir, "iddp-portal/package.json"), "{}");
    await writeFile(join(cloneDir, ".dockerignore"), "**/.env\n");
    const extracted = join(cloneDir, "archive-check");
    const names: string[] = [];
    let archive: Promise<void> | undefined;
    const dial = vi.spyOn(docker.modem, "dial").mockImplementation((options, callback) => {
      archive = pipeline(
        options.file as Readable,
        createGunzip(),
        tar.extract(extracted, { map(header) { names.push(header.name); return header; } }),
      );
      callback!(null, new PassThrough());
    });

    await buildImage({
      cloneDir, imageTag: "fleet/test:dep1", deploymentId: "dep1",
      env: { BACKEND_URL: "https://backend.example.com", NEXT_PUBLIC_FLAG: "", PRIVATE_KEY: "secret" },
    });
    await archive;

    expect(dial.mock.calls[0]![0].options).toMatchObject({
      buildargs: { BACKEND_URL: "https://backend.example.com", NEXT_PUBLIC_FLAG: "" },
    });
    expect(names).toContain("iddp-portal/package.json");
    expect(names).not.toContain("iddp-portal/.env");
    expect(names.some((name) => name === ".git" || name.startsWith(".git/"))).toBe(false);
    expect(mocks.flushLogs).toHaveBeenCalledWith("dep1");
  });

  test("masks build output and Docker error events before publishing", async () => {
    vi.spyOn(docker, "buildImage").mockResolvedValue(new PassThrough());
    vi.spyOn(process.stdout, "write").mockReturnValue(true);
    vi.mocked(docker.modem.followProgress).mockImplementation((_stream, done, progress) => {
      progress!({ stream: "backend=https://backend." });
      progress!({ stream: "example.com\n" });
      progress!({ error: "request failed: https://backend.example.com" });
      done(null, []);
    });

    await expect(buildImage({
      cloneDir, imageTag: "fleet/test:dep1", deploymentId: "dep1",
      env: { BACKEND_URL: "https://backend.example.com" },
    })).rejects.toThrow("request failed: [REDACTED]");
    expect(mocks.publishLog).toHaveBeenCalledWith("dep1", "backend=[REDACTED]", "build");
  });
});
