import type {
  DeploymentStatus,
  EnvironmentType,
  ServerStatus,
} from "./enums";

export interface User {
  name: string;
  userId: string;
  email: string;
  password?: string;
  authProvider?: "email" | "github";
  githubId?: string;
  githubLogin?: string;
  githubAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  name: string;
  projectId: string;
  repoUrl: string;
  userId: string;
  runtime?: string;
}

export interface Environment {
  environmentId: string;
  projectId: string;
  type: EnvironmentType;
  branch: string;
  subdomain: string;
  autoDeploy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Server {
  serverId: string;
  name: string;
  ip: string;
  status: ServerStatus;
  totalRam: number;
  totalCpu: number;
  agentToken: string;
  createdAt: string;
  updatedAt: string;
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
  logs?: string[];
  createdAt: string;
  updatedAt: string;
}
