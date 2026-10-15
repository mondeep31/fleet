import { BUILD_TIMEOUT_MS, buildTimeoutErrorMessage } from "../lib/build-timeout";
import { createBuildLogWriter } from "../lib/build-logs";
import { ensureBuildKit, ensureRailpackBin } from "../lib/railpack";
import { flushLogs, publishLog } from "../services/logs";

interface BuildRailpackParams {
  cloneDir: string;
  imageTag: string;
  deploymentId: string;
  env?: Record<string, string>;
}

export async function buildRailpack({
  cloneDir,
  imageTag,
  deploymentId,
  env = {},
}: BuildRailpackParams): Promise<string> {
  publishLog(deploymentId, "Preparing railpack build environment...", "pipeline");
  const [railpackBin, buildkitHost] = await Promise.all([
    ensureRailpackBin(),
    ensureBuildKit(),
  ]);

  // Railpack exposes these through BuildKit secret mounts. Pass explicit CLI
  // arguments (without a shell) so project PATH/NODE_OPTIONS/etc. cannot change
  // the worker's own build tooling environment.
  const envFlags = Object.entries(env).flatMap(([key, value]) => [
    "--env", `${key}=${value}`,
  ]);
  const proc = Bun.spawn([railpackBin, "build", "--name", imageTag, ...envFlags, cloneDir], {
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      BUILDKIT_HOST: buildkitHost,
    },
  });

  async function streamLines(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const logs = createBuildLogWriter(deploymentId, env);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        logs.write(decoder.decode(value, { stream: true }));
      }
      logs.write(decoder.decode());
    } finally {
      logs.flush();
      reader.releaseLock();
    }
  }

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    proc.kill();
  }, BUILD_TIMEOUT_MS);

  try {
    await Promise.all([
      streamLines(proc.stdout),
      streamLines(proc.stderr),
    ]);

    const exitCode = await proc.exited;
    if (timedOut) {
      throw new Error(buildTimeoutErrorMessage());
    }
    if (exitCode !== 0) {
      throw new Error(`railpack build failed with exit code ${exitCode}`);
    }
  } finally {
    clearTimeout(timeout);
  }

  await flushLogs(deploymentId);
  return imageTag;
}
