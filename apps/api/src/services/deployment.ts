import { enqueueDeploy } from "@fleet/queue";
import { Deployment } from "@fleet/db";
import { AppError } from "@fleet/errors";

const MVP_BRANCH = "main";
const MVP_COMMIT_SHA = "pending";
const MVP_COMMIT_MESSAGE = "Initial deploy";
const MVP_ENVIRONMENT_ID = "default";
const MVP_SERVER_ID = "local";

interface StartDeployParams {
  projectId: string;
  repoUrl: string;
}

interface StartDeployResult {
  deploymentId: string;
  status: string;
}

export async function startDeploy({
  projectId,
  repoUrl,
}: StartDeployParams): Promise<StartDeployResult> {
  const deployment = await Deployment.create({
    projectId,
    branch: MVP_BRANCH,
    commitSha: MVP_COMMIT_SHA,
    commitMessage: MVP_COMMIT_MESSAGE,
    environmentId: MVP_ENVIRONMENT_ID,
    serverId: MVP_SERVER_ID,
    status: "queued",
  });

  await enqueueDeploy({
    deploymentId: deployment.deploymentId,
    projectId,
    repoUrl,
  });

  return {
    deploymentId: deployment.deploymentId,
    status: deployment.status,
  };
}

function toDeploymentResponse(deployment: {
  deploymentId: string;
  projectId: string;
  environmentId: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  serverId: string;
  status: string;
  clonePath?: string | null;
  imageTag?: string | null;
  url?: string | null;
  error?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    deploymentId: deployment.deploymentId,
    projectId: deployment.projectId,
    environmentId: deployment.environmentId,
    commitSha: deployment.commitSha,
    commitMessage: deployment.commitMessage,
    branch: deployment.branch,
    serverId: deployment.serverId,
    status: deployment.status,
    clonePath: deployment.clonePath ?? undefined,
    imageTag: deployment.imageTag ?? undefined,
    url: deployment.url ?? undefined,
    error: deployment.error ?? undefined,
    createdAt: deployment.createdAt,
    updatedAt: deployment.updatedAt,
  };
}

export async function getDeploymentById(deploymentId: string) {
  const deployment = await Deployment.findOne({ deploymentId });
  if (!deployment) {
    throw new AppError(404, "Deployment not found", "DEPLOYMENT_NOT_FOUND");
  }
  return toDeploymentResponse(deployment);
}

export async function getDeploymentsByProjectId(projectId: string) {
  const deployments = await Deployment.find({ projectId }).sort({
    createdAt: -1,
  });
  return deployments.map(toDeploymentResponse);
}
