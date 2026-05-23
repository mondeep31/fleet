import { Router } from "express";
import { validate } from "../middleware/validate";
import { loginBodySchema } from "../validators/user";
import { loginController } from "../controller/user";

const router = Router();

router.post("/login", validate({ body: loginBodySchema }), loginController);

export default router;
