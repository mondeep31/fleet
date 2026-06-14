export interface ProjectVariable {
  key: string;
  hasValue: boolean;
}

export interface EnvVariableRow {
  key: string;
  value: string;
  /** True when this row was loaded from the server and already has a saved value. */
  hasExistingValue?: boolean;
}

export type DeploymentStatus =
  | "queued"
  | "cloning"
  | "cloned"
  | "building"
  | "deploying"
  | "live"
  | "failed"
  | "rolled_back"
  | "stopped"
  | "deleted";

export type ProjectStatus = "active" | "archived";

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  token: string;
}

export interface Project {
  projectId: string;
  name: string;
  repoUrl: string;
  userId: string;
  subdomain: string;
  status?: ProjectStatus;
}

export interface Deployment {
  deploymentId: string;
  projectId: string;
  environmentId: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  serverId: string;
  status: DeploymentStatus;
  clonePath?: string;
  imageTag?: string;
  containerId?: string;
  networkName?: string;
  url?: string;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  message: string;
  success: boolean;
  data: T;
}

export interface ProjectWithLatestDeploy extends Project {
  latestDeployment?: Deployment;
}

export const TERMINAL_STATUSES: DeploymentStatus[] = [
  "live",
  "failed",
  "stopped",
  "deleted",
  "rolled_back",
];

export function isTerminalStatus(status: DeploymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isActiveStatus(status: DeploymentStatus): boolean {
  return !isTerminalStatus(status);
}
