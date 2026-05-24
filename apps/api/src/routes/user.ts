import { Router } from "express";
import {
  createUserController,
  getUserController,
  updateUserController,
} from "../controller/user";
import { validate } from "../middleware/validate";
import { updateUserBodySchema } from "../validators/user";

const router = Router();

router.get("/:id", getUserController);
router.patch(
  "/",
  validate({ body: updateUserBodySchema }),
  updateUserController,
);

export default router;
