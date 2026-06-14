import { Project } from "@fleet/db";
import { buildProjectDeploySubdomain } from "@fleet/config";
import { getErrorMessage } from "@fleet/errors";
import type { DeployJobPayload } from "@fleet/queue";
import { detectDockerfile } from "@fleet/runtime-detector";
import { DeploymentStoppedError } from "../errors/deployment-stopped";
import {
  getDeployment,
  getLiveContainerIdForProject,
  isDeploymentStopped,
  markDeploymentFailed,
  supersedeLiveDeployments,
  updateDeployment,
} from "../services/deployment";
import { finalizeDeploymentLogs, publishLog } from "../services/logs";
import { getDecryptedProjectVariables } from "../services/project-variable";
import { buildImage } from "../steps/build";
import { cloneRepo } from "../steps/clone";
import { removeContainerById, removeProjectContainer } from "../lib/docker";
import { runContainer } from "../steps/run";

async function exitIfStopped(deploymentId: string) {
  if (await isDeploymentStopped(deploymentId)) {
    throw new DeploymentStoppedError(deploymentId);
  }
}

async function getProjectSubdomain(project: {
  projectId: string;
  subdomain?: string | null;
}) {
  const expected = buildProjectDeploySubdomain(project.projectId);

  if (project.subdomain !== expected) {
    await Project.updateOne({ projectId: project.projectId }, { subdomain: expected });
  }

  return expected;
}

export async function handleDeployJob(payload: DeployJobPayload) {
  const { deploymentId, projectId, repoUrl } = payload;

  try {
    await exitIfStopped(deploymentId);
    const deployment = await getDeployment(deploymentId);

    await updateDeployment(deploymentId, { status: "cloning" });
    publishLog(deploymentId, "Cloning repository...", "pipeline");

    const { cloneDir, commitSha } = await cloneRepo({
      repoUrl,
      deploymentId,
      branch: deployment.branch,
    });

    await exitIfStopped(deploymentId);

    await updateDeployment(deploymentId, {
      status: "cloned",
      commitSha,
      clonePath: cloneDir,
    });
    publishLog(
      deploymentId,
      `Clone complete (${commitSha.slice(0, 7)})`,
      "pipeline",
    );
    console.log(`cloned ${deploymentId} → ${cloneDir}`);

    await exitIfStopped(deploymentId);

    const dockerfile = await detectDockerfile(cloneDir);
    if (!dockerfile.found) {
      throw new Error(
        "No Dockerfile found at repository root. Add a Dockerfile or dockerfile to deploy.",
      );
    }
    publishLog(
      deploymentId,
      `Dockerfile found: ${dockerfile.relativePath}`,
      "pipeline",
    );

    await updateDeployment(deploymentId, { status: "building" });
    publishLog(deploymentId, "Building Docker image...", "pipeline");
    const imageTag = `fleet/${deployment.projectId}:${deploymentId}`;
    await buildImage({
      cloneDir,
      imageTag,
      deploymentId,
      dockerfile: dockerfile.relativePath,
    });
    await updateDeployment(deploymentId, { imageTag });
    publishLog(deploymentId, `Build complete: ${imageTag}`, "pipeline");
    console.log(`built ${deploymentId} → ${imageTag}`);

    await exitIfStopped(deploymentId);

    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    const subdomain = await getProjectSubdomain(project);

    // Capture the old container ID before we start the new one so we can
    // remove it after the new container is confirmed running (blue-green).
    const oldContainerId = await getLiveContainerIdForProject(projectId, deploymentId);

    await updateDeployment(deploymentId, { status: "deploying" });
    publishLog(deploymentId, "Deploying container...", "pipeline");

    const envVars = await getDecryptedProjectVariables(projectId);
    const envCount = Object.keys(envVars).length;
    if (envCount > 0) {
      publishLog(deploymentId, `Injecting ${envCount} environment variable${envCount === 1 ? "" : "s"}`, "pipeline");
    }

    // Start the new container. runContainer waits until Docker reports Running.
    // If this throws, the old container is still running — no downtime.
    const { containerId, networkName, url } = await runContainer({
      imageTag,
      projectId,
      deploymentId,
      subdomain,
      env: envVars,
    });

    // New container is running — now cut over by removing the old one.
    if (oldContainerId) {
      await removeContainerById(oldContainerId);
    } else {
      // First deploy: also clean up any legacy fixed-name container that may
      // exist from a pre-blue-green deployment.
      await removeProjectContainer(projectId);
    }

    // Mark previous live deployments as stopped in DB.
    await supersedeLiveDeployments(projectId, deploymentId);

    await updateDeployment(deploymentId, {
      status: "live",
      containerId,
      networkName,
      url,
    });
    publishLog(deploymentId, `Deployment live at ${url}`, "pipeline");
    await finalizeDeploymentLogs(deploymentId);
    console.log(`live ${deploymentId} → ${url}`);
  } catch (err) {
    if (err instanceof DeploymentStoppedError) {
      publishLog(deploymentId, "Deployment stopped", "pipeline");
      await finalizeDeploymentLogs(deploymentId);
      console.log(`stopped ${deploymentId}`);
      return;
    }

    const message = getErrorMessage(err);
    publishLog(deploymentId, `Error: ${message}`, "pipeline");
    await markDeploymentFailed(deploymentId, message).catch((updateErr) => {
      console.error("failed to mark deployment as failed:", updateErr);
    });
    await finalizeDeploymentLogs(deploymentId);
    throw err;
  }
}
