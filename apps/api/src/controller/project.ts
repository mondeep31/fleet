import type { RequestHandler } from "express";
import { startDeploy } from "../services/deployment";
import { createProject, getAllProjectsForAUser } from "../services/project";
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

export { createProjectController, getAllProjectsController };
