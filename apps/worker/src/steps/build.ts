import tar from "tar-fs";
import { getDocker } from "../lib/docker";
import { appendDeploymentLogs } from "../services/deployment";

interface BuildImageParams {
  cloneDir: string;
  imageTag: string;
  deploymentId: string;
}

export async function buildImage({
  cloneDir,
  imageTag,
  deploymentId,
}: BuildImageParams): Promise<string> {
  const docker = getDocker();
  const tarStream = tar.pack(cloneDir);
  const stream = await docker.buildImage(tarStream, { t: imageTag });

  await new Promise<void>((resolve, reject) => {
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
          process.stdout.write(event.stream);
          // TODO: stream logs via SSE/WebSocket instead of polling MongoDB
          void appendDeploymentLogs(
            deploymentId,
            event.stream.split("\n"),
          );
        }
        if (event.error) {
          failed = true;
          reject(new Error(event.error));
        }
      },
    );
  });

  return imageTag;
}
