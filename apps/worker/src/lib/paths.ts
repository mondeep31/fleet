import { join } from "node:path";

const BUILD_ROOT = "/tmp/fleet-builds";

export function getCloneDir(deploymentId: string) {
  return join(BUILD_ROOT, deploymentId);
}
