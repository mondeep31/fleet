import { Router } from "express";
import { validate } from "@fleet/api-middleware";
import {
  connectGitHubController,
  getGitHubStatusController,
  disconnectGitHubController,
  listReposController,
  getRepoController,
  listBranchesController,
  validateDockerfileController,
} from "../controller/github-integration";
import {
  repoOwnerRepoParamsSchema,
  validateDockerfileBodySchema,
  reposQuerySchema,
} from "../validators/github";

const router = Router();

// Connect — redirect to GitHub authorize (requires auth).
router.get("/github/connect", connectGitHubController);

// Status + disconnect.
router.get("/github/status", getGitHubStatusController);
router.delete("/github", disconnectGitHubController);

// Repo endpoints.
router.get(
  "/github/repos",
  validate({ query: reposQuerySchema }),
  listReposController,
);

router.get(
  "/github/repos/:owner/:repo/branches",
  validate({ params: repoOwnerRepoParamsSchema }),
  listBranchesController,
);

// Specific repo metadata — must come after /branches to avoid param collision.
router.get(
  "/github/repos/:owner/:repo",
  validate({ params: repoOwnerRepoParamsSchema }),
  getRepoController,
);

router.post(
  "/github/repos/validate",
  validate({ body: validateDockerfileBodySchema }),
  validateDockerfileController,
);

export default router;
