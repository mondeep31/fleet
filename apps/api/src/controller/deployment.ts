import type { RequestHandler } from "express";
import {
  getDeploymentById,
  getDeploymentsByProjectId,
} from "../services/deployment";

const getDeploymentController: RequestHandler = async (req, res) => {
  const { deploymentId } = req.params;
  const deployment = await getDeploymentById(deploymentId);
  res.status(200).json({
    message: "Deployment fetched successfully",
    success: true,
    data: deployment,
  });
};

const getDeploymentStatusController: RequestHandler = async (req, res) => {
  const { deploymentId } = req.params;
  const deployment = await getDeploymentById(deploymentId);
  res.status(200).json({
    message: "Deployment status fetched successfully",
    success: true,
    data: {
      deploymentId: deployment.deploymentId,
      status: deployment.status,
      url: deployment.url,
      error: deployment.error,
    },
  });
};

const getDeploymentsByProjectController: RequestHandler = async (req, res) => {
  const { projectId } = req.params;
  const deployments = await getDeploymentsByProjectId(projectId);
  res.status(200).json({
    message: "Deployments fetched successfully",
    success: true,
    data: { deployments },
  });
};

export {
  getDeploymentController,
  getDeploymentStatusController,
  getDeploymentsByProjectController,
};
