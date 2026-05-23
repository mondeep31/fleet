import type { RequestHandler } from "express";
import { createProject, getAllProjectsForAUser } from "../services/project";
import type {
  CreateProjectBody,
  GetAllProjectsQuery,
} from "../validators/user";

const createProjectController: RequestHandler = async (req, res) => {
  const { name, repoUrl, userId } = req.body as CreateProjectBody;
  const project = await createProject({ name, repoUrl, userId });
  res.status(201).json(project);
};

const getAllProjectsController: RequestHandler = async (req, res) => {
  const { userId } = req.query as GetAllProjectsQuery;
  const projects = await getAllProjectsForAUser({ userId });
  return res.status(200).json(projects);
};

export { createProjectController, getAllProjectsController };
