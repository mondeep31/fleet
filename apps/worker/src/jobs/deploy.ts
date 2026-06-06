import { getErrorMessage } from "@fleet/errors";
import type { DeployJobPayload } from "@fleet/queue";
import { detectDockerfile } from "@fleet/runtime-detector";
import { DeploymentStoppedError } from "../errors/deployment-stopped";
import {
  appendDeploymentLogs,
  getDeployment,
  isDeploymentStopped,
  markDeploymentFailed,
  updateDeployment,
} from "../services/deployment";
import { buildImage } from "../steps/build";
import { cloneRepo } from "../steps/clone";
import { runContainer } from "../steps/run";

async function exitIfStopped(deploymentId: string) {
  if (await isDeploymentStopped(deploymentId)) {
    throw new DeploymentStoppedError(deploymentId);
  }
}

export async function handleDeployJob(payload: DeployJobPayload) {
  const { deploymentId, repoUrl } = payload;

  try {
    await exitIfStopped(deploymentId);
    const deployment = await getDeployment(deploymentId);

    await updateDeployment(deploymentId, { status: "cloning" });
    await appendDeploymentLogs(deploymentId, ["Cloning repository..."]);

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
    await appendDeploymentLogs(deploymentId, [
      `Clone complete (${commitSha.slice(0, 7)})`,
    ]);
    console.log(`cloned ${deploymentId} → ${cloneDir}`);

    await exitIfStopped(deploymentId);

    const dockerfile = await detectDockerfile(cloneDir);
    if (!dockerfile.found) {
      throw new Error(
        "No Dockerfile found at repository root. Add a Dockerfile or dockerfile to deploy.",
      );
    }
    await appendDeploymentLogs(deploymentId, [
      `Dockerfile found: ${dockerfile.relativePath}`,
    ]);

    await updateDeployment(deploymentId, { status: "building" });
    await appendDeploymentLogs(deploymentId, ["Building Docker image..."]);
    const imageTag = `fleet/${deployment.projectId}:${deploymentId}`;
    await buildImage({
      cloneDir,
      imageTag,
      deploymentId,
      dockerfile: dockerfile.relativePath,
    });
    await updateDeployment(deploymentId, { imageTag });
    await appendDeploymentLogs(deploymentId, [`Build complete: ${imageTag}`]);
    console.log(`built ${deploymentId} → ${imageTag}`);

    await exitIfStopped(deploymentId);

    await updateDeployment(deploymentId, { status: "deploying" });
    await appendDeploymentLogs(deploymentId, ["Deploying container..."]);
    const { url } = await runContainer({ imageTag, deploymentId });
    await updateDeployment(deploymentId, { status: "live", url });
    await appendDeploymentLogs(deploymentId, [`Deployment live at ${url}`]);
    console.log(`live ${deploymentId} → ${url}`);
  } catch (err) {
    if (err instanceof DeploymentStoppedError) {
      await appendDeploymentLogs(deploymentId, ["Deployment stopped"]);
      console.log(`stopped ${deploymentId}`);
      return;
    }

    const message = getErrorMessage(err);
    await markDeploymentFailed(deploymentId, message).catch((updateErr) => {
      console.error("failed to mark deployment as failed:", updateErr);
    });
    throw err;
  }
}
