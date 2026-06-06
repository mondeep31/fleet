import { Router } from "express";
import { getUserController, updateUserController } from "../controller/user";
import { validate } from "@fleet/api-middleware";
import { updateUserBodySchema } from "../validators/user";

const router = Router();

router.get("/:id", getUserController);
router.patch(
  "/",
  validate({ body: updateUserBodySchema }),
  updateUserController,
);

export default router;
