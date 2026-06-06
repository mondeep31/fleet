import { getDocker } from "./docker";

export function getContainerName(deploymentId: string) {
  return `fleet-${deploymentId}`;
}

export async function removeDeploymentContainer(deploymentId: string) {
  const docker = getDocker();
  const container = docker.getContainer(getContainerName(deploymentId));

  try {
    await container.remove({ force: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("404") && !message.toLowerCase().includes("no such container")) {
      throw err;
    }
  }
}
