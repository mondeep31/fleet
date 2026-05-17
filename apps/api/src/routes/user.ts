import { Router } from "express";
import {
  createUserController,
  getUserController,
  updateUserController,
} from "../controller/user";
import { validate } from "../middleware/validate";
import {
  createUserBodySchema,
  updateUserBodySchema,
  userIdParamsSchema,
} from "../validators/user";

const router = Router();

// TODO : add authentication middleware
router.post(
  "/",
  validate({ body: createUserBodySchema }),
  createUserController,
);
router.get("/:id", validate({ params: userIdParamsSchema }), getUserController);
router.put(
  "/:id",
  validate({ params: userIdParamsSchema, body: updateUserBodySchema }),
  updateUserController,
);

export default router;
