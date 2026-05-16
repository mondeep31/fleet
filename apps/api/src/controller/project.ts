import type { RequestHandler } from "express";
import { createProject } from "../services/project";
import type { CreateProjectBody } from "../validators/user";

const createProjectController: RequestHandler = async (req, res) => {
  const { name, repoUrl } = req.body as CreateProjectBody;
  const userId = req.params.userId as string;
  const project = await createProject({ name, repoUrl, userId });
  res.status(201).json(project);
};

export { createProjectController };
