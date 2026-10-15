export interface ProjectVariable {
  key: string;
  hasValue: boolean;
}

export type DomainStatus = "pending" | "active" | "error" | "deleted";

export interface Domain {
  _id: string;
  projectId: string;
  domain: string;
  status: DomainStatus;
  hostnameStatus?: string;
  sslStatus?: string;
  ownershipVerification?: {
    type?: string;
    name?: string;
    value?: string;
    http_url?: string;
    http_body?: string;
  };
  sslValidationRecords?: Array<{
    txt_name?: string;
    txt_value?: string;
    http_url?: string;
    http_body?: string;
  }>;
  error?: string;
  lastCheckedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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
  plan?: string;
}

export interface GitHubStatus {
  connected: boolean;
  username?: string;
  fineGrained?: boolean;
  needsReconnect?: boolean;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  private: boolean;
  description: string | null;
  default_branch: string;
  updated_at: string;
}

export interface GitHubBranch {
  name: string;
}

export interface DockerfileValidation {
  ok: boolean;
  buildMethod?: "dockerfile" | "railpack";
  dockerfilePath?: string;
  reason?: string;
}

export interface Project {
  projectId: string;
  name: string;
  repoUrl: string;
  userId: string;
  subdomain: string;
  branch: string;
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
