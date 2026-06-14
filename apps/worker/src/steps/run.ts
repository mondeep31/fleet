import {
  buildAppUrlFromEnv,
  getSharedEnv,
} from "@fleet/config";
import {
  ensureNetwork,
  ensureTraefikNetwork,
  getDeploymentContainerName,
  getDocker,
  getProjectNetworkName,
} from "../lib/docker";

interface RunContainerParams {
  imageTag: string;
  projectId: string;
  deploymentId: string;
  subdomain: string;
  env?: Record<string, string>;
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
  const sharedEnv = getSharedEnv();
  const routerName = `fleet${projectId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const host = `${subdomain}.${sharedEnv.FLEET_APPS_DOMAIN}`;

  return {
    "traefik.enable": "true",
    "traefik.docker.network": sharedEnv.FLEET_TRAEFIK_NETWORK,
    [`traefik.http.routers.${routerName}.rule`]: `Host(\`${host}\`)`,
    [`traefik.http.routers.${routerName}.entrypoints`]: "web",
    [`traefik.http.routers.${routerName}.service`]: routerName,
    [`traefik.http.services.${routerName}.loadbalancer.server.port`]:
      containerPort.replace("/tcp", "").replace("/udp", ""),
  };
}

/**
 * Starts a new deployment container with a deployment-scoped name.
 * Does NOT remove any existing container — the caller handles cutover
 * after confirming the new container is running.
 */
export async function runContainer({
  imageTag,
  projectId,
  deploymentId,
  subdomain,
  env = {},
}: RunContainerParams): Promise<RunContainerResult> {
  const docker = getDocker();
  const sharedEnv = getSharedEnv();
  const containerPort = await getContainerPort(imageTag);
  const containerName = getDeploymentContainerName(projectId, deploymentId);
  const projectNetworkName = getProjectNetworkName(projectId);
  const traefikNetworkName = await ensureTraefikNetwork();

  await ensureNetwork(projectNetworkName);

  const container = await docker.createContainer({
    Image: imageTag,
    name: containerName,
    ExposedPorts: {
      [containerPort]: {},
    },
    Env: Object.entries(env).map(([k, v]) => `${k}=${v}`),
    Labels: buildTraefikLabels({ projectId, subdomain, containerPort }),
    NetworkingConfig: {
      EndpointsConfig: {
        [projectNetworkName]: {
          Aliases: [`app-${projectId}`],
        },
        [traefikNetworkName]: {},
      },
    },
  });

  await container.start();

  // Wait until Docker reports the container as running (up to 30s).
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const info = await container.inspect();
    if (info.State.Running) break;
    if (info.State.Dead || info.State.OOMKilled) {
      throw new Error(`Container exited immediately after start (exitCode=${info.State.ExitCode})`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const inspect = await container.inspect();

  return {
    containerId: inspect.Id,
    networkName: projectNetworkName,
    url: buildAppUrlFromEnv(subdomain, sharedEnv),
  };
}
