import { Router } from "express";
import {
  getDeploymentController,
  getDeploymentLogsController,
  getDeploymentStatusController,
  getDeploymentsByProjectController,
  stopDeploymentController,
  streamDeploymentLogsController,
} from "../controller/deployment";

const router = Router();

router.get("/project/:projectId", getDeploymentsByProjectController);
router.get("/:deploymentId/status", getDeploymentStatusController);
router.get("/:deploymentId/logs/stream", streamDeploymentLogsController);
router.get("/:deploymentId/logs", getDeploymentLogsController);
router.get("/:deploymentId", getDeploymentController);
router.delete("/:deploymentId", stopDeploymentController);

export default router;
