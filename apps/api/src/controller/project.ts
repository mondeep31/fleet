import type { RequestHandler } from "express";
import { startDeploy } from "../services/deployment";
import {
  archiveProject,
  createProject,
  getAllProjectsForAUser,
  startProjectDeployment,
} from "../services/project";
import type { CreateProjectBody } from "../validators/user";

const createProjectController: RequestHandler = async (req, res) => {
  const { name, repoUrl } = req.body as CreateProjectBody;
  const userId = req.user!.userId;
  const project = await createProject({ name, repoUrl, userId });
  const deployment = await startDeploy({
    projectId: project.id,
    repoUrl: project.repoUrl,
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

export {
  archiveProjectController,
  createProjectController,
  getAllProjectsController,
  startProjectDeploymentController,
};
