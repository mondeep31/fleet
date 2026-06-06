import { getErrorMessage } from "@fleet/errors";
import type { DeployJobPayload } from "@fleet/queue";
import {
  getDeployment,
  markDeploymentFailed,
  updateDeployment,
} from "../services/deployment";
import { cloneRepo } from "../steps/clone";

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
  } catch (err) {
    const message = getErrorMessage(err);
    await markDeploymentFailed(deploymentId, message).catch((updateErr) => {
      console.error("failed to mark deployment as failed:", updateErr);
    });
    throw err;
  }
}
