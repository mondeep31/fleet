import type { RequestHandler } from "express";
import { createProject, getAllProjectsForAUser } from "../services/project";
import type { CreateProjectBody } from "../validators/user";

const createProjectController: RequestHandler = async (req, res) => {
  const { name, repoUrl } = req.body as CreateProjectBody;
  const userId = req.user!.userId;
  const project = await createProject({ name, repoUrl, userId });
  res.status(201).json({
    message: "Project created successfully",
    success: true,
    data: project,
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
