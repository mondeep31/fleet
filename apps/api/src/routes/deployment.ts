import { Router } from "express";

const router = Router();

/***
 * redeploy api is needed. when we create a new project, we push to deployment queue
 * apis needed:
 * 1. redeploy
 * 2. get all deployments for a project
 * 2. get deployment status
 * 3. get deployment logs
 * 4. delete deployment
 */
router.post("/", (req, res) => {
  res.json({ message: "Hello, world!" });
});

// get all deployments for a project
router.get("/:projectId", (req, res) => {
  res.json({ message: "Hello, world!" });
});

router.get("/:deploymentId/status", (req, res) => {
  res.json({ message: "Hello, world!" });
});

router.get("/:deploymentId/logs", (req, res) => {
  res.json({ message: "Hello, world!" });
});

router.delete("/:deploymentId", (req, res) => {
  res.json({ message: "Hello, world!" });
});

export default router;
