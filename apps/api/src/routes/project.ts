import { Router } from "express";
import { validate } from "@fleet/api-middleware";
import {
  archiveProjectController,
  createProjectController,
  getAllProjectsController,
  getProjectVariablesController,
  startProjectDeploymentController,
  updateProjectVariablesController,
} from "../controller/project";
import {
  addDomainController,
  deleteDomainController,
  listDomainsController,
  verifyDomainController,
} from "../controller/domain";
import {
  createProjectBodySchema,
  projectIdParamsSchema,
  projectVariablesBodySchema,
} from "../validators/user";
import { addDomainBodySchema, domainIdParamsSchema } from "../validators/domain";

const router = Router();

router.post(
  "/",
  validate({ body: createProjectBodySchema }),
  createProjectController,
);

router.get("/", getAllProjectsController);

router.post(
  "/:projectId/deploy",
  validate({ params: projectIdParamsSchema }),
  startProjectDeploymentController,
);

router.delete(
  "/:projectId",
  validate({ params: projectIdParamsSchema }),
  archiveProjectController,
);

router.get(
  "/:projectId/variables",
  validate({ params: projectIdParamsSchema }),
  getProjectVariablesController,
);

router.put(
  "/:projectId/variables",
  validate({ params: projectIdParamsSchema, body: projectVariablesBodySchema }),
  updateProjectVariablesController,
);

router.get(
  "/:projectId/domains",
  validate({ params: projectIdParamsSchema }),
  listDomainsController,
);

router.post(
  "/:projectId/domains",
  validate({ params: projectIdParamsSchema, body: addDomainBodySchema }),
  addDomainController,
);

router.post(
  "/:projectId/domains/:domainId/verify",
  validate({ params: domainIdParamsSchema }),
  verifyDomainController,
);

router.delete(
  "/:projectId/domains/:domainId",
  validate({ params: domainIdParamsSchema }),
  deleteDomainController,
);

export default router;
