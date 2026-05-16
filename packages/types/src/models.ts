import type { DeploymentStatus, RuntimeType, ServerStatus } from "./enums";

export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface Server {
  id: string;
  userId: string;
  name: string;
  ip: string;
  status: ServerStatus;
  totalRam: number;
  totalCpu: number;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  serverId: string;
  name: string;
  repoUrl: string;
  branch: string;
  subdomain: string;
  runtime: RuntimeType;
  createdAt: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  commitSha: string;
  commitMessage: string;
  imageTag: string;
  error?: string;
  queuedAt: string;
  buildingAt: string;
  deployingAt: string;
  liveAt: string;
  failedAt: string;
}
