import { cancelDeployJob, enqueueDeploy } from "@fleet/queue";
import { Deployment, Project } from "@fleet/db";
import { AppError } from "@fleet/errors";
import { getProjectContainerName, removeProjectContainer } from "../lib/containers";
import { getPrimaryCustomUrl, getPrimaryCustomUrls } from "../lib/custom-domain-url";

const MVP_COMMIT_SHA = "pending";
const MVP_COMMIT_MESSAGE = "Initial deploy";
const MVP_ENVIRONMENT_ID = "default";
const MVP_SERVER_ID = "local";

interface StartDeployParams {
  projectId: string;
  repoUrl: string;
  branch: string;
  commitSha?: string;
  commitMessage?: string;
}

interface StartDeployResult {
  deploymentId: string;
  status: string;
}

export async function startDeploy({
  projectId,
  repoUrl,
  branch,
  commitSha,
  commitMessage,
}: StartDeployParams): Promise<StartDeployResult> {
  const deployment = await Deployment.create({
    projectId,
    branch,
    commitSha: commitSha ?? MVP_COMMIT_SHA,
    commitMessage: commitMessage ?? MVP_COMMIT_MESSAGE,
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

function toDeploymentResponse(
  deployment: {
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
    containerId?: string | null;
    networkName?: string | null;
    url?: string | null;
    error?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  },
  // A project's own custom domain (once active) takes priority over the
  // fixed depl-fleet-{projectId} wildcard URL — but only when the deployment
  // actually has a URL at all (stopped/queued/etc. deployments stay urlless).
  customUrl?: string | null,
) {
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
    containerId: deployment.containerId ?? undefined,
    networkName: deployment.networkName ?? undefined,
    url: deployment.url ? (customUrl ?? deployment.url) : undefined,
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
  const customUrl = await getPrimaryCustomUrl(deployment.projectId);
  return toDeploymentResponse(deployment, customUrl);
}

export async function listDeploymentsByProjectId(projectId: string) {
  const deployments = await Deployment.find({ projectId }).sort({
    createdAt: -1,
  });
  const customUrl = await getPrimaryCustomUrl(projectId);
  return deployments.map((deployment) => toDeploymentResponse(deployment, customUrl));
}

export async function getLatestDeploymentsForProjects(projectIds: string[]) {
  if (projectIds.length === 0) {
    return new Map<string, ReturnType<typeof toDeploymentResponse>>();
  }

  const deployments = await Deployment.find({
    projectId: { $in: projectIds },
  }).sort({ createdAt: -1 });
  const customUrls = await getPrimaryCustomUrls(projectIds);

  const latestByProject = new Map<string, ReturnType<typeof toDeploymentResponse>>();
  for (const deployment of deployments) {
    if (!latestByProject.has(deployment.projectId)) {
      latestByProject.set(
        deployment.projectId,
        toDeploymentResponse(deployment, customUrls.get(deployment.projectId)),
      );
    }
  }
  return latestByProject;
}

export async function getDeploymentsByProjectId(
  projectId: string,
  userId: string,
) {
  await assertProjectAccess(projectId, userId);

  return listDeploymentsByProjectId(projectId);
}

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await Project.findOne({ projectId });
  if (!project || project.userId !== userId) {
    throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND");
  }
  if (project.status === "archived") {
    throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND");
  }
  return project;
}

export async function assertDeploymentOwnership(deploymentId: string, userId: string) {
  const deployment = await Deployment.findOne({ deploymentId });
  if (!deployment) {
    throw new AppError(404, "Deployment not found", "DEPLOYMENT_NOT_FOUND");
  }

  const project = await Project.findOne({ projectId: deployment.projectId });
  if (!project || project.userId !== userId) {
    throw new AppError(403, "Forbidden", "FORBIDDEN");
  }

  return deployment;
}

export async function stopDeployment(deploymentId: string, userId: string) {
  const deployment = await assertDeploymentOwnership(deploymentId, userId);

  if (deployment.status === "deleted" || deployment.status === "stopped") {
    return toDeploymentResponse(deployment);
  }

  await cancelDeployJob(deploymentId);
  await removeProjectContainer(deployment.projectId, deployment.containerId ?? null);

  const updated = await Deployment.findOneAndUpdate(
    { deploymentId },
    { status: "deleted", $unset: { url: 1 } },
    { new: true },
  );

  if (!updated) {
    throw new AppError(404, "Deployment not found", "DEPLOYMENT_NOT_FOUND");
  }

  return toDeploymentResponse(updated);
}
