import { BUILD_TIMEOUT_MS, buildTimeoutErrorMessage } from "../lib/build-timeout";
import { ensureBuildKit, ensureRailpackBin } from "../lib/railpack";
import { flushLogs, publishLog } from "../services/logs";

interface BuildRailpackParams {
  cloneDir: string;
  imageTag: string;
  deploymentId: string;
}

export async function buildRailpack({
  cloneDir,
  imageTag,
  deploymentId,
}: BuildRailpackParams): Promise<string> {
  publishLog(deploymentId, "Preparing railpack build environment...", "pipeline");
  const [railpackBin, buildkitHost] = await Promise.all([
    ensureRailpackBin(),
    ensureBuildKit(),
  ]);

  const proc = Bun.spawn([railpackBin, "build", "--name", imageTag, cloneDir], {
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
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          process.stdout.write(buffer);
          publishLog(deploymentId, [buffer], "build");
        }
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      process.stdout.write(chunk);
      buffer += chunk;

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      if (lines.length > 0) {
        publishLog(deploymentId, lines, "build");
      }
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
