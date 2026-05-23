import { Router } from "express";
import { validate } from "../middleware/validate";
import { createProjectBodySchema } from "../validators/user";
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

router.get("/", getAllProjectsController);

export default router;
