import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  createProjectBodySchema,
  getAllProjectsQuerySchema,
} from "../validators/user";
import {
  createProjectController,
  getAllProjectsController,
} from "../controller/project";

const router = Router();

router.post(
  "/",
  validate({ body: createProjectBodySchema }),
  createProjectController,
);

router.get(
  "/",
  validate({ query: getAllProjectsQuerySchema }),
  getAllProjectsController,
);

export default router;
