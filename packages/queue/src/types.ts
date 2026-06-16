export interface DeployJobPayload {
  deploymentId: string;
  projectId: string;
  repoUrl: string;
}

export type EmailJobPayload =
  | { type: "signup"; to: string; name: string }
  | { type: "login"; to: string; name: string; loginAt?: string }
  | { type: "password-reset"; to: string; name: string; code: string };
