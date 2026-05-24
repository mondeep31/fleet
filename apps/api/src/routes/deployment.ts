import { Router } from "express";

const router = Router();

/***
 * redeploy api is needed. when we create a new project, we push to deployment queue
 * apis needed:
 * 1. redeploy
 * 2. get deployment status
 * 3. get deployment logs
 * 4. delete deployment
 */
router.post("/", (req, res) => {
  res.json({ message: "Hello, world!" });
});

export default router;
