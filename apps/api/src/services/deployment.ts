import { enqueueDeploy } from "@fleet/queue";
import { Deployment } from "@fleet/db";

const MVP_BRANCH = "main";
const MVP_COMMIT_SHA = "pending";
const MVP_COMMIT_MESSAGE = "Initial deploy";
const MVP_ENVIRONMENT_ID = "default";
const MVP_SERVER_ID = "local";

interface StartDeployParams {
  projectId: string;
  repoUrl: string;
}

interface StartDeployResult {
  deploymentId: string;
  status: string;
}

export async function startDeploy({
  projectId,
  repoUrl,
}: StartDeployParams): Promise<StartDeployResult> {
  const deployment = await Deployment.create({
    projectId,
    branch: MVP_BRANCH,
    commitSha: MVP_COMMIT_SHA,
    commitMessage: MVP_COMMIT_MESSAGE,
    environmentId: MVP_ENVIRONMENT_ID,
    serverId: MVP_SERVER_ID,
    status: "queued",
  });

  await enqueueDeploy({
    deploymentId: deployment.deploymentId,
    projectId,
    repoUrl,
  });

  return {
    deploymentId: deployment.deploymentId,
    status: deployment.status,
  };
}
