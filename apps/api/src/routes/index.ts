import { Router } from "express";
import userRouter from "./user";
import projectRouter from "./project";
import deploymentRouter from "./deployment";
import githubIntegrationRouter from "./github-integration";

const router = Router();

router.use("/users", userRouter);
router.use("/projects", projectRouter);
router.use("/deployments", deploymentRouter);
router.use("/integrations", githubIntegrationRouter);

export default router;
