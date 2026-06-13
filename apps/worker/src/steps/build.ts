import tar from "tar-fs";
import { getDocker } from "../lib/docker";
import { flushLogs, publishLog } from "../services/logs";

interface BuildImageParams {
  cloneDir: string;
  imageTag: string;
  deploymentId: string;
  dockerfile?: string;
}

export async function buildImage({
  cloneDir,
  imageTag,
  deploymentId,
  dockerfile = "Dockerfile",
}: BuildImageParams): Promise<string> {
  const docker = getDocker();
  const tarStream = tar.pack(cloneDir);
  const stream = await docker.buildImage(tarStream, {
    t: imageTag,
    dockerfile,
  });

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
          publishLog(deploymentId, event.stream.split("\n"), "build");
        }
        if (event.error) {
          failed = true;
          reject(new Error(event.error));
        }
      },
    );
  });

  await flushLogs(deploymentId);
  return imageTag;
}
