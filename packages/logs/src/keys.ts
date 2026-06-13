export const DEPLOYMENT_LOG_TTL_SECONDS = 24 * 60 * 60;

export function deploymentLogsStreamKey(deploymentId: string): string {
  return `logs:${deploymentId}`;
}
