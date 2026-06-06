export class DeploymentStoppedError extends Error {
  constructor(deploymentId: string) {
    super(`Deployment stopped: ${deploymentId}`);
    this.name = "DeploymentStoppedError";
  }
}
