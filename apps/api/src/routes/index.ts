import { Router } from "express";
import userRouter from "./user";
import projectRouter from "./project";

const router = Router();

router.use("/users", userRouter);
router.use("/projects", projectRouter);

export default router;
