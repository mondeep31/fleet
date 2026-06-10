import { ensureNetwork, getDocker, getProjectNetworkName } from "../lib/docker";

interface RunContainerParams {
  imageTag: string;
  deploymentId: string;
  projectId: string;
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

export async function runContainer({
  imageTag,
  deploymentId,
  projectId,
}: RunContainerParams): Promise<RunContainerResult> {
  const docker = getDocker();
  const containerPort = await getContainerPort(imageTag);
  const containerName = `fleet-${deploymentId}`;
  const networkName = await ensureNetwork(getProjectNetworkName(projectId));

  try {
    const existing = docker.getContainer(containerName);
    await existing.remove({ force: true });
  } catch {
    // no existing container
  }

  const container = await docker.createContainer({
    Image: imageTag,
    name: containerName,
    ExposedPorts: {
      [containerPort]: {},
    },
    HostConfig: {
      NetworkMode: networkName,
      PortBindings: {
        [containerPort]: [{ HostIp: "0.0.0.0", HostPort: "0" }],
      },
    },
    NetworkingConfig: {
      EndpointsConfig: {
        [networkName]: {
          Aliases: [`app-${deploymentId}`],
        },
      },
    },
  });

  await container.start();

  const inspect = await container.inspect();
  const hostPort = inspect.NetworkSettings.Ports[containerPort]?.[0]?.HostPort;

  if (!hostPort) {
    throw new Error(
      `No host port assigned for container port ${containerPort}`,
    );
  }

  return {
    containerId: inspect.Id,
    networkName,
    url: `http://localhost:${hostPort}`,
  };
}
