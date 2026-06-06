"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import {
  isActiveStatus,
  isTerminalStatus,
  type Deployment,
} from "@/lib/types";

export function useDeploymentsByProject(projectId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ deployments: Deployment[] }>(
    projectId ? `deployments-project-${projectId}` : null,
    () => api.getDeploymentsByProject(projectId!),
    {
      refreshInterval: (latestData) => {
        const latest = latestData?.deployments?.[0];
        if (!latest) return 0;
        return isActiveStatus(latest.status) ? 5000 : 0;
      },
    },
  );

  return {
    deployments: data?.deployments ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useDeployment(deploymentId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Deployment>(
    deploymentId ? `deployment-${deploymentId}` : null,
    () => api.getDeployment(deploymentId!),
    {
      refreshInterval: (latestData) => {
        if (!latestData) return 0;
        return isActiveStatus(latestData.status) ? 3000 : 0;
      },
    },
  );

  return {
    deployment: data,
    isLoading,
    error,
    mutate,
  };
}

export function useDeploymentLogs(
  deploymentId: string | undefined,
  status: Deployment["status"] | undefined,
) {
  const shouldPoll = status ? !isTerminalStatus(status) : false;

  const { data, error, isLoading } = useSWR<{ deploymentId: string; logs: string[] }>(
    deploymentId ? `deployment-logs-${deploymentId}` : null,
    () => api.getDeploymentLogs(deploymentId!),
    {
      refreshInterval: shouldPoll ? 2000 : 0,
    },
  );

  return {
    logs: data?.logs ?? [],
    isLoading,
    error,
  };
}
