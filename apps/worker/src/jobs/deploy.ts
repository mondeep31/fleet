import { getErrorMessage } from "@fleet/errors";
import type { DeployJobPayload } from "@fleet/queue";
import {
  getDeployment,
  markDeploymentFailed,
  updateDeployment,
} from "../services/deployment";
import { buildImage } from "../steps/build";
import { cloneRepo } from "../steps/clone";
import { runContainer } from "../steps/run";

export async function handleDeployJob(payload: DeployJobPayload) {
  const { deploymentId, repoUrl } = payload;

  try {
    const deployment = await getDeployment(deploymentId);

    await updateDeployment(deploymentId, { status: "cloning" });

    const { cloneDir, commitSha } = await cloneRepo({
      repoUrl,
      deploymentId,
      branch: deployment.branch,
    });

    await updateDeployment(deploymentId, {
      status: "cloned",
      commitSha,
      clonePath: cloneDir,
    });

    console.log(`cloned ${deploymentId} → ${cloneDir}`);

    await updateDeployment(deploymentId, { status: "building" });
    const imageTag = `fleet/${deployment.projectId}:${deploymentId}`;
    await buildImage({ cloneDir, imageTag });
    await updateDeployment(deploymentId, { imageTag });
    console.log(`built ${deploymentId} → ${imageTag}`);

    await updateDeployment(deploymentId, { status: "deploying" });
    const { url } = await runContainer({ imageTag, deploymentId });
    await updateDeployment(deploymentId, { status: "live", url });
    console.log(`live ${deploymentId} → ${url}`);
  } catch (err) {
    const message = getErrorMessage(err);
    await markDeploymentFailed(deploymentId, message).catch((updateErr) => {
      console.error("failed to mark deployment as failed:", updateErr);
    });
    throw err;
  }
}
