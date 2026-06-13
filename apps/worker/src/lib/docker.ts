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

export function getProjectContainerName(projectId: string) {
  return `fleet-project-${projectId}`;
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
