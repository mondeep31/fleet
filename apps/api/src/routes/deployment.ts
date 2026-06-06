import { Router } from "express";
import {
  getDeploymentController,
  getDeploymentStatusController,
  getDeploymentsByProjectController,
} from "../controller/deployment";

const router = Router();

router.get("/project/:projectId", getDeploymentsByProjectController);
router.get("/:deploymentId/status", getDeploymentStatusController);
router.get("/:deploymentId/logs", (req, res) => {
  res.json({ message: "Hello, world!" });
});
router.get("/:deploymentId", getDeploymentController);
router.delete("/:deploymentId", (req, res) => {
  res.json({ message: "Hello, world!" });
});

export default router;
