export type DeploymentStatus =
  | "queued"
  | "cloning"
  | "cloned"
  | "building"
  | "deploying"
  | "live"
  | "failed"
  | "rolled_back"
  | "stopped";

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
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl?: string;
    avatar_url?: string;
  };
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
  "rolled_back",
];

export function isTerminalStatus(status: DeploymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isActiveStatus(status: DeploymentStatus): boolean {
  return !isTerminalStatus(status);
}
