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

/** @deprecated Use getProjectContainerName(projectId) — containers are named per project. */
export function getContainerName(deploymentId: string) {
  return `fleet-${deploymentId}`;
}

export async function removeProjectContainer(projectId: string) {
  const docker = getDocker();
  const container = docker.getContainer(getProjectContainerName(projectId));

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

export async function removeDeploymentContainer(
  deploymentId: string,
  projectId: string,
) {
  await removeProjectContainer(projectId);
}
