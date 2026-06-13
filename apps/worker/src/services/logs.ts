import {
  BatchedDeploymentLogPublisher,
  expireDeploymentLogs,
  type DeploymentLogSource,
} from "@fleet/logs";

const publisher = new BatchedDeploymentLogPublisher();

export function publishLog(
  deploymentId: string,
  lines: string | string[],
  source: DeploymentLogSource,
): void {
  const batch = Array.isArray(lines) ? lines : [lines];
  publisher.append(deploymentId, batch, source);
}

export async function flushLogs(deploymentId: string): Promise<void> {
  await publisher.flush(deploymentId);
}

export async function finalizeDeploymentLogs(deploymentId: string): Promise<void> {
  await publisher.flush(deploymentId);
  await expireDeploymentLogs(deploymentId);
}
