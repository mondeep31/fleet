import { getDocker } from "../lib/docker";
import { getContainerName } from "../lib/containers";

function extractLines(buffer: Buffer): { lines: string[]; consumed: number } {
  const lines: string[] = [];
  let offset = 0;

  while (offset + 8 <= buffer.length) {
    const frameSize = buffer.readUInt32BE(offset + 4);
    const frameEnd = offset + 8 + frameSize;
    if (frameEnd > buffer.length) break;

    const payload = buffer.subarray(offset + 8, frameEnd).toString("utf8");
    for (const line of payload.split("\n")) {
      const trimmed = line.trimEnd();
      if (trimmed.length > 0) lines.push(trimmed);
    }

    offset = frameEnd;
  }

  return { lines, consumed: offset };
}

export async function* tailContainerLogs(
  deploymentId: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const docker = getDocker();
  const container = docker.getContainer(getContainerName(deploymentId));

  const logStream = (await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
    tail: 100,
  })) as NodeJS.ReadableStream;

  let buffer = Buffer.alloc(0);
  const queue: string[] = [];
  let pendingResolve: (() => void) | null = null;
  let ended = false;
  let streamError: Error | null = null;

  const notify = () => {
    pendingResolve?.();
    pendingResolve = null;
  };

  logStream.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    const { lines, consumed } = extractLines(buffer);
    buffer = buffer.subarray(consumed);
    queue.push(...lines);
    notify();
  });

  logStream.on("end", () => {
    ended = true;
    notify();
  });

  logStream.on("error", (err: Error) => {
    streamError = err;
    ended = true;
    notify();
  });

  try {
    while (!signal?.aborted && !ended) {
      if (queue.length === 0) {
        await new Promise<void>((resolve) => {
          pendingResolve = resolve;
        });
        continue;
      }

      while (queue.length > 0) {
        const line = queue.shift();
        if (line) yield line;
      }
    }

    while (queue.length > 0) {
      const line = queue.shift();
      if (line) yield line;
    }

    if (streamError) throw streamError;
  } finally {
    logStream.destroy();
  }
}
