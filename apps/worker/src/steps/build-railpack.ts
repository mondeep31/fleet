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
  const proc = Bun.spawn(["railpack", "build", "--name", imageTag, cloneDir], {
    stdout: "pipe",
    stderr: "pipe",
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

  await Promise.all([
    streamLines(proc.stdout),
    streamLines(proc.stderr),
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`railpack build failed with exit code ${exitCode}`);
  }

  await flushLogs(deploymentId);
  return imageTag;
}
