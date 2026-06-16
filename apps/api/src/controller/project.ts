import type { RequestHandler } from "express";
import { startDeploy } from "../services/deployment";
import {
  archiveProject,
  createProject,
  getAllProjectsForAUser,
  startProjectDeployment,
  assertProjectOwnership,
} from "../services/project";
import {
  listProjectVariables,
  saveProjectVariables,
} from "../services/project-variable";
import type { CreateProjectBody, ProjectVariablesBody } from "../validators/user";

const createProjectController: RequestHandler = async (req, res) => {
  const { name, repoUrl, branch, variables } = req.body as CreateProjectBody;
  const userId = req.user!.userId;
  const project = await createProject({ name, repoUrl, branch, userId, variables });
  const deployment = await startDeploy({
    projectId: project.projectId,
    repoUrl: project.repoUrl,
    branch: project.branch,
  });
  res.status(201).json({
    message: "Project created successfully",
    success: true,
    data: {
      ...project,
      deploymentId: deployment.deploymentId,
      deploymentStatus: deployment.status,
    },
  });
};

const getAllProjectsController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const projects = await getAllProjectsForAUser({ userId });
  return res.status(200).json({
    message: "Projects fetched successfully",
    success: true,
    data: projects,
  });
};

const archiveProjectController: RequestHandler = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user!.userId;
  const project = await archiveProject(projectId, userId);
  res.status(200).json({
    message: "Project archived successfully",
    success: true,
    data: project,
  });
};

const startProjectDeploymentController: RequestHandler = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user!.userId;
  const deployment = await startProjectDeployment(projectId, userId);
  res.status(201).json({
    message: "Deployment started successfully",
    success: true,
    data: deployment,
  });
};

const getProjectVariablesController: RequestHandler = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user!.userId;
  await assertProjectOwnership(projectId, userId);
  const variables = await listProjectVariables(projectId);
  res.status(200).json({
    message: "Variables fetched successfully",
    success: true,
    data: { variables },
  });
};

const updateProjectVariablesController: RequestHandler = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user!.userId;
  await assertProjectOwnership(projectId, userId);
  const variables = req.body as ProjectVariablesBody;
  await saveProjectVariables(projectId, variables);
  const updated = await listProjectVariables(projectId);

  // Auto-redeploy unless the caller opts out with ?redeploy=false.
  let redeploy: { started: boolean; deploymentId?: string; reason?: string };
  if (req.query["redeploy"] === "false") {
    redeploy = { started: false, reason: "skipped by caller" };
  } else {
    try {
      const deployment = await startProjectDeployment(projectId, userId);
      redeploy = { started: true, deploymentId: deployment.deploymentId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      redeploy = { started: false, reason: message };
    }
  }

  res.status(200).json({
    message: "Variables updated successfully",
    success: true,
    data: { variables: updated, redeploy },
  });
};

export {
  archiveProjectController,
  createProjectController,
  getAllProjectsController,
  startProjectDeploymentController,
  getProjectVariablesController,
  updateProjectVariablesController,
};
