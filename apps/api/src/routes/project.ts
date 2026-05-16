import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  createProjectBodySchema,
  type CreateProjectBody,
} from "../validators/user";
import { createProjectController } from "../controller/project";

const router = Router();

router.post(
  "/",
  validate({ body: createProjectBodySchema }),
  createProjectController,
);

export default router;
