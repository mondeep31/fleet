import type { RequestHandler } from "express";
import { AppError } from "@fleet/errors";
import {
  getDeploymentById,
  getDeploymentsByProjectId,
  stopDeployment,
} from "../services/deployment";
import { streamDeploymentLogs } from "../services/log-stream";

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
  const userId = req.user!.userId;
  const deployments = await getDeploymentsByProjectId(projectId, userId);
  res.status(200).json({
    message: "Deployments fetched successfully",
    success: true,
    data: { deployments },
  });
};

const getDeploymentLogsController: RequestHandler = (_req, res) => {
  throw new AppError(
    410,
    "Log polling is deprecated. Use GET /deployments/:deploymentId/logs/stream instead.",
    "LOGS_ENDPOINT_DEPRECATED",
  );
};

const streamDeploymentLogsController: RequestHandler = async (req, res, next) => {
  const { deploymentId } = req.params;
  const userId = req.user!.userId;
  const abortController = new AbortController();

  req.on("close", () => {
    abortController.abort();
  });

  try {
    await streamDeploymentLogs(
      deploymentId,
      userId,
      res,
      abortController.signal,
    );
  } catch (err) {
    if (!res.headersSent) {
      next(err);
      return;
    }
    res.end();
  }
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
  streamDeploymentLogsController,
};
