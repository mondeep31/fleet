import { Router } from "express";
import userRouter from "./user";
import projectRouter from "./project";
import deploymentRouter from "./deployment";

const router = Router();

router.use("/users", userRouter);
router.use("/projects", projectRouter);
router.use("/deployments", deploymentRouter);

export default router;
