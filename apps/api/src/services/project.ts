import { Project } from "@fleet/db";
import { buildProjectDeploySubdomain } from "@fleet/config";
import { AppError } from "@fleet/errors";
import {
  listDeploymentsByProjectId,
  getLatestDeploymentsForProjects,
  startDeploy,
  stopDeployment,
} from "./deployment";
import { saveProjectVariables, type VariableInput } from "./project-variable";
import { validateRepoDockerfile } from "./github-repos";
import { ensureRepoWebhook, removeRepoWebhookIfUnused } from "./github-hooks";

interface CreateProjectParams {
  name: string;
  repoUrl: string;
  branch: string;
  userId: string;
  variables?: VariableInput[];
}

interface GetAllProjectsForAUserParams {
  userId: string;
}

type LatestDeployment = Awaited<
  ReturnType<typeof getLatestDeploymentsForProjects>
> extends Map<string, infer D>
  ? D
  : never;

interface ProjectResponse {
  projectId: string;
  name: string;
  repoUrl: string;
  branch: string;
  userId: string;
  subdomain: string;
  status: string;
  latestDeployment?: LatestDeployment;
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
  branch,
  userId,
  variables = [],
}: CreateProjectParams) => {
  // Pre-flight check for GitHub repos: validates the repo is accessible and
  // determines the build method (Dockerfile or railpack auto-detection).
  // Only fails on actual GitHub API errors, not on missing Dockerfiles.
  const githubMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
  if (githubMatch) {
    const [, owner, repo] = githubMatch;
    const validation = await validateRepoDockerfile(userId, owner, repo, branch);
    if (!validation.ok) {
      throw new AppError(400, validation.reason, "REPO_VALIDATION_FAILED");
    }
  }

  const projectId = crypto.randomUUID();
  const subdomain = buildProjectDeploySubdomain(projectId);

  // Register the GitHub webhook before writing to the DB so that if hook
  // creation fails we fail fast without leaving an orphaned project.
  let githubHookId: number | undefined;
  if (githubMatch) {
    const [, owner, repo] = githubMatch;
    githubHookId = await ensureRepoWebhook(userId, owner, repo);
  }

  const project = await Project.create({
    name,
    repoUrl,
    branch,
    userId,
    projectId,
    subdomain,
    ...(githubHookId !== undefined ? { githubHookId } : {}),
  });

  if (variables.length > 0) {
    await saveProjectVariables(projectId, variables);
  }

  return {
    projectId: project.projectId,
    name: project.name,
    repoUrl: project.repoUrl,
    branch: project.branch,
    userId: project.userId,
    subdomain: project.subdomain,
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

  const projectResponses: ProjectResponse[] = projects.map((project) => ({
    projectId: project.projectId,
    name: project.name,
    repoUrl: project.repoUrl,
    branch: project.branch ?? "main",
    userId: project.userId,
    subdomain: project.subdomain,
    status: project.status ?? "active",
  }));

  const latestByProject = await getLatestDeploymentsForProjects(
    projectResponses.map((p) => p.projectId),
  );

  return {
    projects: projectResponses.map((p) => ({
      ...p,
      latestDeployment: latestByProject.get(p.projectId),
    })),
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

  // Best-effort: remove the GitHub webhook if no other active project uses this repo.
  await removeRepoWebhookIfUnused(
    userId,
    projectId,
    project.repoUrl,
    project.githubHookId as number | undefined,
  );

  return {
    projectId: updated.projectId,
    name: updated.name,
    subdomain: updated.subdomain,
    status: updated.status,
  };
}

async function deployIfIdle(project: {
  projectId: string;
  repoUrl: string;
  branch?: string | null;
}) {
  const deployments = await listDeploymentsByProjectId(project.projectId);
  const hasInProgress = deployments.some((d) =>
    IN_PROGRESS_DEPLOYMENT_STATUSES.includes(
      d.status as (typeof IN_PROGRESS_DEPLOYMENT_STATUSES)[number],
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
    branch: project.branch ?? "main",
  });
}

export async function startProjectDeployment(projectId: string, userId: string) {
  const project = await assertProjectOwnership(projectId, userId);
  return deployIfIdle(project);
}

/**
 * Triggers a deployment for a project without requiring a userId.
 * Used by the GitHub webhook handler where there is no authenticated user.
 * Silently returns null (rather than throwing) when the project is not found or
 * archived, so the webhook handler can iterate over multiple projects gracefully.
 */
export async function triggerDeployForProject(
  projectId: string,
): Promise<{ deploymentId: string; status: string } | null> {
  const project = await Project.findOne({ projectId, status: "active" });
  if (!project) return null;
  return deployIfIdle({
    projectId: project.projectId,
    repoUrl: project.repoUrl,
    branch: project.branch,
  });
}
