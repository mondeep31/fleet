export type DeploymentLogSource = "build" | "pipeline" | "runtime";

export interface DeploymentLogEntry {
  line: string;
  source: DeploymentLogSource;
}
