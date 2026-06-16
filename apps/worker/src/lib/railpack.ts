import { constants } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type Docker from "dockerode";
import { access, mkdir } from "fs-extra";
import { getDocker } from "./docker";

const BUILDKIT_CONTAINER = "fleet-buildkit";
const REPO = "railwayapp/railpack";
const BUILDKIT_IMAGE = "moby/buildkit:latest";

async function ensureBuildKitImage(docker: Docker): Promise<void> {
  try {
    await docker.getImage(BUILDKIT_IMAGE).inspect();
    return;
  } catch {
    // Image missing — pull below.
  }

  await new Promise<void>((resolve, reject) => {
    docker.pull(BUILDKIT_IMAGE, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err || !stream) {
        reject(err ?? new Error("Failed to pull buildkit image"));
        return;
      }
      docker.modem.followProgress(stream, (pullErr: Error | null) => {
        if (pullErr) {
          reject(pullErr);
          return;
        }
        resolve();
      });
    });
  });
}

export function getRailpackBinDir(): string {
  return process.env.FLEET_RAILPACK_BIN_DIR ?? join(homedir(), ".fleet", "bin");
}

function getRailpackBinPath(): string {
  return join(getRailpackBinDir(), "railpack");
}

function detectTarget(): string {
  const arch = process.arch === "arm64" ? "arm64" : "x86_64";
  if (process.platform === "darwin") {
    return `${arch}-apple-darwin`;
  }
  if (process.platform === "linux") {
    return `${arch}-unknown-linux-musl`;
  }
  throw new Error(`Unsupported platform for railpack: ${process.platform}`);
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function getLatestRailpackVersion(): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch railpack release info: HTTP ${response.status}`);
  }
  const data = (await response.json()) as { tag_name?: string };
  const tag = data.tag_name;
  if (!tag) {
    throw new Error("Failed to detect latest railpack version from GitHub");
  }
  return tag.replace(/^v/, "");
}

async function downloadRailpack(binDir: string): Promise<void> {
  const version = process.env.RAILPACK_VERSION ?? (await getLatestRailpackVersion());
  const target = detectTarget();
  const url = `https://github.com/${REPO}/releases/download/v${version}/railpack-v${version}-${target}.tar.gz`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download railpack v${version} for ${target}: HTTP ${response.status}`);
  }

  const extract = Bun.spawn(["tar", "-xzf", "-", "-C", binDir], {
    stdin: response.body ?? undefined,
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await extract.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(extract.stderr).text();
    throw new Error(`Failed to extract railpack: ${stderr.trim() || `exit code ${exitCode}`}`);
  }
}

export async function ensureRailpackBin(): Promise<string> {
  const binPath = getRailpackBinPath();
  if (await isExecutable(binPath)) {
    return binPath;
  }

  const binDir = getRailpackBinDir();
  await mkdir(binDir, { recursive: true });
  await downloadRailpack(binDir);

  if (!(await isExecutable(binPath))) {
    throw new Error(`railpack was installed but is not executable at ${binPath}`);
  }

  return binPath;
}

export async function ensureBuildKit(): Promise<string> {
  const buildkitHost = `docker-container://${BUILDKIT_CONTAINER}`;
  const docker = getDocker();

  try {
    const container = docker.getContainer(BUILDKIT_CONTAINER);
    const info = await container.inspect();
    if (!info.State.Running) {
      await container.start();
    }
    return buildkitHost;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const missing =
      message.includes("404") || message.toLowerCase().includes("no such container");
    if (!missing) {
      throw err;
    }
  }

  await ensureBuildKitImage(docker);

  const created = await docker.createContainer({
    name: BUILDKIT_CONTAINER,
    Image: BUILDKIT_IMAGE,
    HostConfig: { Privileged: true },
    Tty: false,
  });

  await created.start();
  return buildkitHost;
}
