import { join } from "node:path";
import fs from "fs-extra";

const DOCKERFILE_NAMES = ["Dockerfile", "dockerfile"] as const;

export type DockerfileDetection =
  | { found: true; relativePath: string; absolutePath: string }
  | { found: false };

export async function detectDockerfile(
  cloneDir: string,
): Promise<DockerfileDetection> {
  const entries = await fs.readdir(cloneDir);

  for (const name of DOCKERFILE_NAMES) {
    if (entries.includes(name)) {
      return {
        found: true,
        relativePath: name,
        absolutePath: join(cloneDir, name),
      };
    }
  }

  return { found: false };
}
