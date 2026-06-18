import { Project } from "@fleet/db";
import { buildProjectDeploySubdomain, isUnlimitedPlan } from "@fleet/config";
import { getErrorMessage } from "@fleet/errors";
import type { DeployJobPayload } from "@fleet/queue";
import { detectDockerfile } from "@fleet/runtime-detector";
import { DeploymentStoppedError } from "../errors/deployment-stopped";
import {
  getDeployment,
  isDeploymentStopped,
  markDeploymentFailed,
  supersedeLiveDeployments,
  updateDeployment,
} from "../services/deployment";
import { finalizeDeploymentLogs, publishLog } from "../services/logs";
import { getDecryptedGitHubToken } from "../services/github-integration";
import { getDecryptedProjectVariables } from "../services/project-variable";
import { getComputeLimitsForUser } from "../services/user-plan";
import { buildImage } from "../steps/build";
import { buildRailpack } from "../steps/build-railpack";
import { cloneRepo } from "../steps/clone";
import { isGitHubRepoUrl } from "../lib/github-repo";
import {
  ensureTraefikOnProjectNetwork,
  removeAllProjectContainers,
  removeContainerById,
} from "../lib/docker";
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

  // Track the new container ID so the catch block can clean it up on failure.
  let newContainerId: string | null = null;

  try {
    await exitIfStopped(deploymentId);
    const deployment = await getDeployment(deploymentId);

    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    await updateDeployment(deploymentId, { status: "cloning" });
    publishLog(deploymentId, "Cloning repository...", "pipeline");

    let githubToken: string | undefined;
    if (isGitHubRepoUrl(repoUrl)) {
      githubToken = await getDecryptedGitHubToken(project.userId);
    }

    const { cloneDir, commitSha, commitMessage } = await cloneRepo({
      repoUrl,
      deploymentId,
      branch: deployment.branch,
      githubToken,
    });

    await exitIfStopped(deploymentId);

    await updateDeployment(deploymentId, {
      status: "cloned",
      commitSha,
      commitMessage,
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

    await updateDeployment(deploymentId, { status: "building" });
    const imageTag = `fleet/${deployment.projectId}:${deploymentId}`;

    if (dockerfile.found) {
      publishLog(
        deploymentId,
        `Dockerfile found: ${dockerfile.relativePath}`,
        "pipeline",
      );
      publishLog(deploymentId, "Building Docker image...", "pipeline");
      await buildImage({
        cloneDir,
        imageTag,
        deploymentId,
        dockerfile: dockerfile.relativePath,
      });
    } else {
      publishLog(
        deploymentId,
        "No Dockerfile found, using railpack for auto-detection...",
        "pipeline",
      );
      await buildRailpack({ cloneDir, imageTag, deploymentId });
    }

    await updateDeployment(deploymentId, { imageTag });
    publishLog(deploymentId, `Build complete: ${imageTag}`, "pipeline");
    console.log(`built ${deploymentId} → ${imageTag}`);

    await exitIfStopped(deploymentId);

    const subdomain = await getProjectSubdomain(project);

    await updateDeployment(deploymentId, { status: "deploying" });
    publishLog(deploymentId, "Deploying container...", "pipeline");

    const envVars = await getDecryptedProjectVariables(projectId);
    const envCount = Object.keys(envVars).length;
    if (envCount > 0) {
      publishLog(deploymentId, `Injecting ${envCount} environment variable${envCount === 1 ? "" : "s"}`, "pipeline");
    }

    const computeLimits = await getComputeLimitsForUser(project.userId);
    publishLog(
      deploymentId,
      isUnlimitedPlan(computeLimits)
        ? "Container limits: unlimited"
        : `Container limits: ${computeLimits.memoryMb}MB RAM, ${computeLimits.nanoCpus / 1_000_000_000} CPU`,
      "pipeline",
    );

    // Phase 1: Start the new container on the project network only (not yet
    // connected to Traefik). If this fails, nothing has changed for the user.
    const { containerId, networkName, url } = await runContainer({
      imageTag,
      projectId,
      deploymentId,
      subdomain,
      env: envVars,
      computeLimits,
    });
    newContainerId = containerId;

    // Phase 2: Remove EVERY other project container (old live, legacy
    // fixed-name, orphans from failed deploys). After this call there is only
    // one container for this project — the new one, not yet routable.
    await removeAllProjectContainers(projectId, containerId);

    // Phase 3: Attach Traefik to the project network so it can route traffic
    // without placing the app on the shared proxy network (tenant isolation).
    await ensureTraefikOnProjectNetwork(networkName);

    // Phase 4: Bookkeeping — mark old DB records stopped, new one live.
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

    // If a container was created for this deployment but the cutover failed,
    // remove it so it doesn't linger as a Traefik backend or an orphan.
    if (newContainerId) {
      await removeContainerById(newContainerId).catch((cleanupErr) => {
        console.error("failed to remove orphan container after deploy error:", cleanupErr);
      });
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
