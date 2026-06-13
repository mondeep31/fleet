import { Router } from "express";
import { validate } from "@fleet/api-middleware";
import {
  archiveProjectController,
  createProjectController,
  getAllProjectsController,
  startProjectDeploymentController,
} from "../controller/project";
import {
  createProjectBodySchema,
  projectIdParamsSchema,
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

export default router;
