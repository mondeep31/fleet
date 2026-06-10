import { Deployment } from "@fleet/db";

interface DeploymentUpdate {
  status?: string;
  commitSha?: string;
  clonePath?: string;
  imageTag?: string;
  containerId?: string;
  networkName?: string;
  url?: string;
  error?: string;
}

export async function getDeployment(deploymentId: string) {
  const deployment = await Deployment.findOne({ deploymentId });
  if (!deployment) {
    throw new Error(`Deployment not found: ${deploymentId}`);
  }
  return deployment;
}

export async function updateDeployment(
  deploymentId: string,
  patch: DeploymentUpdate,
) {
  const deployment = await Deployment.findOneAndUpdate(
    { deploymentId },
    patch,
    { new: true },
  );
  if (!deployment) {
    throw new Error(`Deployment not found: ${deploymentId}`);
  }
  return deployment;
}

export async function markDeploymentFailed(
  deploymentId: string,
  error: string,
) {
  return updateDeployment(deploymentId, {
    status: "failed",
    error,
  });
}

export async function appendDeploymentLogs(
  deploymentId: string,
  lines: string[],
) {
  const trimmed = lines.map((line) => line.trimEnd()).filter((line) => line.length > 0);
  if (trimmed.length === 0) return;

  await Deployment.findOneAndUpdate(
    { deploymentId },
    { $push: { logs: { $each: trimmed } } },
  );
}

export async function isDeploymentStopped(
  deploymentId: string,
): Promise<boolean> {
  const deployment = await Deployment.findOne({ deploymentId })
    .select("status")
    .lean();
  return deployment?.status === "stopped";
}
