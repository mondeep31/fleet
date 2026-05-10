// messages the API sends TO the agent
import type { DeploymentStatus } from "./enums";

export type ApiToAgentMessage =
  | {
      type: "deploy";
      deploymentId: string;
      repoUrl: string;
      imageTag: string;
      networkName: string;
      subdomain: string;
      env: Record<string, string>;
    }
  | {
      type: "stop";
      containerId: string;
      deploymentId: string;
    }
  | {
      type: "rollback";
      deploymentId: string;
      imageTag: string;
      networkName: string;
      subdomain: string;
    };

// messages the agent sends TO the api
export type AgentToApiMessage =
  | {
      type: "log";
      deploymentId: string;
      line: string;
      stream: "stdout" | "stderr";
      timestamp: string;
    }
  | {
      type: "status";
      deploymentId: string;
      status: DeploymentStatus;
      error?: string;
    }
  | {
      type: "register";
      agentToken: string;
      ip: string;
      totalRam: number;
      totalCpu: number;
    };
