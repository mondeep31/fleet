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

/** Labels attached to every Fleet-managed container for reliable project-scoped filtering. */
export function buildFleetLabels(projectId: string, deploymentId: string) {
  return {
    "fleet.managed": "true",
    "fleet.project.id": projectId,
    "fleet.deployment.id": deploymentId,
  };
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

/**
 * List all running containers that belong to a project, identified by the
 * fleet.project.id label. Falls back to a name-prefix filter for legacy
 * containers created before labels were added.
 */
export async function listProjectContainers(
  projectId: string,
): Promise<Docker.ContainerInfo[]> {
  const docker = getDocker();
  const namePrefix = getProjectContainerName(projectId);

  const byLabel = await docker.listContainers({
    all: true,
    filters: JSON.stringify({ label: [`fleet.project.id=${projectId}`] }),
  });

  // Also catch legacy fixed-name containers that predate fleet labels.
  const byName = await docker.listContainers({
    all: true,
    filters: JSON.stringify({ name: [namePrefix] }),
  });

  // Merge by Id, deduplicating.
  const seen = new Set<string>();
  const result: Docker.ContainerInfo[] = [];
  for (const c of [...byLabel, ...byName]) {
    if (!seen.has(c.Id)) {
      seen.add(c.Id);
      result.push(c);
    }
  }
  return result;
}

/**
 * Force-remove all project containers EXCEPT the one being promoted.
 * This is the authoritative cleanup — it handles legacy containers, orphans
 * from failed deploys, and any containers that survived a previous cutover.
 */
export async function removeAllProjectContainers(
  projectId: string,
  exceptContainerId: string,
): Promise<void> {
  const docker = getDocker();
  const containers = await listProjectContainers(projectId);

  await Promise.all(
    containers
      .filter((c) => c.Id !== exceptContainerId)
      .map(async (c) => {
        try {
          await docker.getContainer(c.Id).remove({ force: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (
            !message.includes("404") &&
            !message.toLowerCase().includes("no such container")
          ) {
            throw err;
          }
        }
      }),
  );
}

/**
 * Connect a running container to the Traefik network so it starts receiving
 * traffic. Called after all sibling containers have been removed, ensuring
 * exactly one container is live behind the router at any time.
 */
export async function attachContainerToTraefik(containerId: string): Promise<void> {
  const env = getSharedEnv();
  const docker = getDocker();
  const traefikNetworkName = env.FLEET_TRAEFIK_NETWORK;
  const network = docker.getNetwork(traefikNetworkName);
  await network.connect({ Container: containerId });
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
