export type DeploymentStatus =
  | "queued"
  | "building"
  | "deploying"
  | "live"
  | "failed"
  | "rolled_back";

export type RuntimeType =
  | "nextjs"
  | "node"
  | "bun"
  | "go"
  | "rust"
  | "python"
  | "docker"
  | "unknown";

export type ServerStatus = "connected" | "disconnected";

/** Matches Environment.type in the API DB model (prod, staging, dev). */
export type EnvironmentType = "prod" | "staging" | "dev";
