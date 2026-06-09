import { Router } from "express";
import userRouter from "./user";
import projectRouter from "./project";
import deploymentRouter from "./deployment";
import githubRouter from "./github";

const router = Router();

router.use("/users", userRouter);
router.use("/projects", projectRouter);
router.use("/deployments", deploymentRouter);
router.use("/github", githubRouter);

export default router;
