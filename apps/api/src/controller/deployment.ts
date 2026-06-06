import type { RequestHandler } from "express";
import {
  getDeploymentById,
  getDeploymentLogs,
  getDeploymentsByProjectId,
  stopDeployment,
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

// TODO: stream logs in real time (SSE/WebSocket) — currently returns full array from DB
const getDeploymentLogsController: RequestHandler = async (req, res) => {
  const { deploymentId } = req.params;
  const userId = req.user!.userId;
  const logs = await getDeploymentLogs(deploymentId, userId);
  res.status(200).json({
    message: "Deployment logs fetched successfully",
    success: true,
    data: logs,
  });
};

const stopDeploymentController: RequestHandler = async (req, res) => {
  const { deploymentId } = req.params;
  const userId = req.user!.userId;
  const deployment = await stopDeployment(deploymentId, userId);
  res.status(200).json({
    message: "Deployment stopped successfully",
    success: true,
    data: deployment,
  });
};

export {
  getDeploymentController,
  getDeploymentLogsController,
  getDeploymentStatusController,
  getDeploymentsByProjectController,
  stopDeploymentController,
};
