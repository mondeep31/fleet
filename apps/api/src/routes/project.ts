import { Router } from "express";
import { validate } from "@fleet/api-middleware";
import {
  archiveProjectController,
  createProjectController,
  getAllProjectsController,
  getProjectVariablesController,
  startProjectDeploymentController,
  updateProjectVariablesController,
} from "../controller/project";
import {
  createProjectBodySchema,
  projectIdParamsSchema,
  projectVariablesBodySchema,
} from "../validators/user";

const router = Router();

router.post(
  "/",
  validate({ body: createProjectBodySchema }),
  createProjectController,
);

router.get("/", getAllProjectsController);

router.post(
  "/:projectId/deploy",
  validate({ params: projectIdParamsSchema }),
  startProjectDeploymentController,
);

router.delete(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  archiveProjectController,
);

router.get(
  "/:projectId/variables",
  validate({ params: projectIdParamsSchema }),
  getProjectVariablesController,
);

router.put(
  "/:projectId/variables",
  validate({ params: projectIdParamsSchema, body: projectVariablesBodySchema }),
  updateProjectVariablesController,
);

export default router;
