import { Router } from "express";
import { validate } from "@fleet/api-middleware";
import {
  loginBodySchema,
  createUserBodySchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from "../validators/user";
import {
  loginController,
  createUserController,
  requestPasswordResetController,
  confirmPasswordResetController,
} from "../controller/user";

const router = Router();

router.post("/login", validate({ body: loginBodySchema }), loginController);
router.post(
  "/signup",
  validate({ body: createUserBodySchema }),
  createUserController,
);
router.post(
  "/password-reset/request",
  validate({ body: passwordResetRequestSchema }),
  requestPasswordResetController,
);
router.post(
  "/password-reset/confirm",
  validate({ body: passwordResetConfirmSchema }),
  confirmPasswordResetController,
);

export default router;
