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
