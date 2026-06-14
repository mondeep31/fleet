import Docker from "dockerode";
import { getSharedEnv } from "@fleet/config";

let docker: Docker | null = null;

export function getDocker() {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
}

export function getProjectNetworkName(projectId: string) {
  return `fleet-project-${projectId}`;
}

/** Legacy fixed container name — kept for stop/cleanup of pre-blue-green deployments. */
export function getProjectContainerName(projectId: string) {
  return `fleet-project-${projectId}`;
}

/** Deployment-scoped container name used for blue-green cutover. */
export function getDeploymentContainerName(projectId: string, deploymentId: string) {
  return `fleet-project-${projectId}-${deploymentId}`;
}

export async function ensureTraefikNetwork() {
  const env = getSharedEnv();
  return ensureNetwork(env.FLEET_TRAEFIK_NETWORK);
}

export async function ensureNetwork(networkName: string) {
  const docker = getDocker();
  const network = docker.getNetwork(networkName);

  try {
    await network.inspect();
    return networkName;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      !message.includes("404") &&
      !message.toLowerCase().includes("no such network")
    ) {
      throw err;
    }
  }

  try {
    await docker.createNetwork({
      Name: networkName,
      Driver: "bridge",
      CheckDuplicate: true,
      Labels: {
        "fleet.managed": "true",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("already exists")) {
      throw err;
    }
  }

  return networkName;
}

/** Remove a container by its Docker container ID. Silently ignores 404 (already gone). */
export async function removeContainerById(containerId: string) {
  const docker = getDocker();
  try {
    await docker.getContainer(containerId).remove({ force: true });
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

/** Remove by legacy fixed project name. Used for stop of old-style deployments. */
export async function removeProjectContainer(projectId: string) {
  const docker = getDocker();
  const containerName = getProjectContainerName(projectId);
  try {
    await docker.getContainer(containerName).remove({ force: true });
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
