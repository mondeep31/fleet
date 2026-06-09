import { Router } from "express";
import { listGitHubReposController } from "../controller/github";

const router = Router();

router.get("/repos", listGitHubReposController);

export default router;
