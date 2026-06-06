import { Router } from "express";
import { validate } from "@fleet/api-middleware";
import { loginBodySchema } from "../validators/user";
import { loginController, createUserController } from "../controller/user";
import { createUserBodySchema } from "../validators/user";

const router = Router();

router.post("/login", validate({ body: loginBodySchema }), loginController);
router.post(
  "/signup",
  validate({ body: createUserBodySchema }),
  createUserController,
);

export default router;
