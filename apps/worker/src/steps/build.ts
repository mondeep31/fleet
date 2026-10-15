import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Readable } from "node:stream";
import { getDockerBuildArgs } from "../lib/build-env";
import { createBuildLogWriter, redactBuildSecrets } from "../lib/build-logs";
import { BUILD_TIMEOUT_MS, buildTimeoutErrorMessage } from "../lib/build-timeout";
import { getDocker } from "../lib/docker";
import { flushLogs } from "../services/logs";

interface BuildImageParams {
  cloneDir: string;
  imageTag: string;
  deploymentId: string;
  dockerfile?: string;
  env?: Record<string, string>;
}

export async function buildImage({
  cloneDir,
  imageTag,
  deploymentId,
  dockerfile = "Dockerfile",
  env = {},
}: BuildImageParams): Promise<string> {
  const docker = getDocker();
  const buildargs = getDockerBuildArgs(
    await readFile(join(cloneDir, dockerfile), "utf8"),
    env,
  );
  // Let dockerode apply .dockerignore rather than sending an unfiltered tarball.
  // Git metadata may contain the authenticated clone URL and is never needed.
  const src = (await readdir(cloneDir)).filter((name) => name !== ".git");
  const stream = await docker.buildImage({ context: cloneDir, src }, {
    t: imageTag,
    dockerfile,
    buildargs,
  }) as Readable;
  const logs = createBuildLogWriter(deploymentId, env);

  const buildPromise = new Promise<void>((resolve, reject) => {
    let failed = false;

    docker.modem.followProgress(
      stream,
      (err) => {
        if (err || failed) {
          reject(err ?? new Error("Docker build failed"));
          return;
        }
        resolve();
      },
      (event) => {
        if (event.stream) {
          logs.write(event.stream);
        }
        if (event.error) {
          failed = true;
          reject(new Error(redactBuildSecrets(event.error, env)));
        }
      },
    );
  });

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      stream.destroy();
      reject(new Error(`Docker ${buildTimeoutErrorMessage().toLowerCase()}`));
    }, BUILD_TIMEOUT_MS);
  });

  try {
    await Promise.race([buildPromise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
    logs.flush();
  }

  await flushLogs(deploymentId);
  return imageTag;
}
