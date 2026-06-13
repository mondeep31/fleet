import {
  buildAppUrlFromEnv,
  getSharedEnv,
} from "@fleet/config";
import {
  ensureNetwork,
  ensureTraefikNetwork,
  getDocker,
  getProjectContainerName,
  getProjectNetworkName,
} from "../lib/docker";

interface RunContainerParams {
  imageTag: string;
  projectId: string;
  subdomain: string;
}

interface RunContainerResult {
  containerId: string;
  networkName: string;
  url: string;
}

async function getContainerPort(imageTag: string): Promise<string> {
  const docker = getDocker();
  const image = await docker.getImage(imageTag).inspect();
  const exposed = Object.keys(image.Config.ExposedPorts ?? {});

  if (exposed.length === 0) {
    throw new Error(`Image ${imageTag} does not expose any ports`);
  }

  return exposed[0]!;
}

function buildTraefikLabels({
  projectId,
  subdomain,
  containerPort,
}: {
  projectId: string;
  subdomain: string;
  containerPort: string;
}) {
  const env = getSharedEnv();
  const routerName = projectId.replace(/[^a-zA-Z0-9]/g, "");
  const host = `${subdomain}.${env.FLEET_APPS_DOMAIN}`;

  return {
    "traefik.enable": "true",
    "traefik.docker.network": env.FLEET_TRAEFIK_NETWORK,
    [`traefik.http.routers.${routerName}.rule`]: `Host(\`${host}\`)`,
    [`traefik.http.routers.${routerName}.entrypoints`]: "web",
    [`traefik.http.routers.${routerName}.service`]: routerName,
    [`traefik.http.services.${routerName}.loadbalancer.server.port`]:
      containerPort.replace("/tcp", "").replace("/udp", ""),
  };
}

export async function removeProjectContainer(projectId: string) {
  const docker = getDocker();
  const containerName = getProjectContainerName(projectId);

  try {
    const existing = docker.getContainer(containerName);
    await existing.remove({ force: true });
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

export async function runContainer({
  imageTag,
  projectId,
  subdomain,
}: RunContainerParams): Promise<RunContainerResult> {
  const docker = getDocker();
  const env = getSharedEnv();
  const containerPort = await getContainerPort(imageTag);
  const containerName = getProjectContainerName(projectId);
  const projectNetworkName = getProjectNetworkName(projectId);
  const traefikNetworkName = await ensureTraefikNetwork();

  await ensureNetwork(projectNetworkName);
  await removeProjectContainer(projectId);

  const container = await docker.createContainer({
    Image: imageTag,
    name: containerName,
    ExposedPorts: {
      [containerPort]: {},
    },
    Labels: buildTraefikLabels({ projectId, subdomain, containerPort }),
    HostConfig: {
      NetworkMode: projectNetworkName,
    },
    NetworkingConfig: {
      EndpointsConfig: {
        [projectNetworkName]: {
          Aliases: [`app-${projectId}`],
        },
      },
    },
  });

  await container.start();

  const traefikNetwork = docker.getNetwork(traefikNetworkName);
  await traefikNetwork.connect({ Container: container.id });

  const inspect = await container.inspect();

  return {
    containerId: inspect.Id,
    networkName: projectNetworkName,
    url: buildAppUrlFromEnv(subdomain, env),
  };
}
