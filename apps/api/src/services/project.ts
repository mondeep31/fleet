import { Project } from "@fleet/db";
import { AppError } from "@fleet/errors";
import {
  listDeploymentsByProjectId,
  startDeploy,
  stopDeployment,
} from "./deployment";

interface CreateProjectParams {
  name: string;
  repoUrl: string;
  userId: string;
}

interface GetAllProjectsForAUserParams {
  userId: string;
}

interface ProjectResponse {
  projectId: string;
  name: string;
  repoUrl: string;
  userId: string;
  status: string;
}

const IN_PROGRESS_DEPLOYMENT_STATUSES = [
  "queued",
  "cloning",
  "cloned",
  "building",
  "deploying",
] as const;

const STOPPABLE_DEPLOYMENT_STATUSES = [
  "queued",
  "cloning",
  "cloned",
  "building",
  "deploying",
  "live",
] as const;

export async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await Project.findOne({ projectId });
  if (!project || project.userId !== userId) {
    throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND");
  }
  if (project.status === "archived") {
    throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND");
  }
  return project;
}

export const createProject = async ({
  name,
  repoUrl,
  userId,
}: CreateProjectParams) => {
  const project = await Project.create({ name, repoUrl, userId });
  return {
    id: project.projectId,
    name: project.name,
    repoUrl: project.repoUrl,
    userId: project.userId,
    status: project.status ?? "active",
  };
};

export const getAllProjectsForAUser = async ({
  userId,
}: GetAllProjectsForAUserParams) => {
  const projects = await Project.find({
    userId,
    status: { $ne: "archived" },
  });
  if (!projects) {
    throw new AppError(404, "No projects found", "NO_PROJECTS_FOUND");
  }
  return {
    projects: projects.map(
      (project): ProjectResponse => ({
        projectId: project.projectId,
        name: project.name,
        repoUrl: project.repoUrl,
        userId: project.userId,
        status: project.status ?? "active",
      }),
    ),
  };
};

export async function archiveProject(projectId: string, userId: string) {
  const project = await Project.findOne({ projectId });
  if (!project || project.userId !== userId) {
    throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND");
  }
  if (project.status === "archived") {
    throw new AppError(409, "Project is already archived", "PROJECT_ARCHIVED");
  }

  const deployments = await listDeploymentsByProjectId(projectId);
  const stoppable = deployments.filter((deployment) =>
    STOPPABLE_DEPLOYMENT_STATUSES.includes(
      deployment.status as (typeof STOPPABLE_DEPLOYMENT_STATUSES)[number],
    ),
  );

  await Promise.all(
    stoppable.map((deployment) =>
      stopDeployment(deployment.deploymentId, userId),
    ),
  );

  const updated = await Project.findOneAndUpdate(
    { projectId },
    { status: "archived" },
    { new: true },
  );

  if (!updated) {
    throw new AppError(404, "Project not found", "PROJECT_NOT_FOUND");
  }

  return {
    projectId: updated.projectId,
    name: updated.name,
    status: updated.status,
  };
}

export async function startProjectDeployment(projectId: string, userId: string) {
  const project = await assertProjectOwnership(projectId, userId);

  const deployments = await listDeploymentsByProjectId(projectId);
  const hasInProgress = deployments.some((deployment) =>
    IN_PROGRESS_DEPLOYMENT_STATUSES.includes(
      deployment.status as (typeof IN_PROGRESS_DEPLOYMENT_STATUSES)[number],
    ),
  );

  if (hasInProgress) {
    throw new AppError(
      409,
      "A deployment is already in progress",
      "DEPLOYMENT_IN_PROGRESS",
    );
  }

  return startDeploy({
    projectId: project.projectId,
    repoUrl: project.repoUrl,
  });
}
