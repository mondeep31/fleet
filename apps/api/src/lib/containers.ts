import Docker from "dockerode";

let docker: Docker | null = null;

export function getDocker() {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
}

export function getProjectContainerName(projectId: string) {
  return `fleet-project-${projectId}`;
}

async function removeContainerSilently(container: Docker.Container) {
  try {
    await container.remove({ force: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      !message.includes("404") &&
      !message.toLowerCase().includes("no such container")
    ) {
      throw err;
    }
  }
}

/**
 * Remove the container associated with a deployment.
 * Prefers the stored containerId (blue-green deployments) and falls back to
 * the legacy fixed project container name for older deployments.
 */
export async function removeProjectContainer(
  projectId: string,
  containerId?: string | null,
) {
  const docker = getDocker();

  if (containerId) {
    await removeContainerSilently(docker.getContainer(containerId));
    return;
  }

  // Legacy fallback: fixed container name used before blue-green.
  await removeContainerSilently(
    docker.getContainer(getProjectContainerName(projectId)),
  );
}

export async function removeDeploymentContainer(
  deploymentId: string,
  projectId: string,
) {
  await removeProjectContainer(projectId);
}
