import { getToken } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import type {
  ApiResponse,
  AuthUser,
  Deployment,
  EnvVariableRow,
  Project,
  ProjectVariable,
  ProjectWithLatestDeploy,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/api-proxy";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | { message?: string; code?: string }
    | null;

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new ApiError("Unauthorized", 401);
  }

  if (!response.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      `Request failed (${response.status})`;
    const code =
      payload && "code" in payload ? (payload.code as string) : undefined;
    throw new ApiError(message, response.status, code);
  }

  if (!payload || !("data" in payload)) {
    throw new ApiError("Invalid API response", response.status);
  }

  return payload.data;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthUser>("/v1/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false),

  signup: (name: string, email: string, password: string) =>
    request<AuthUser>("/v1/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }, false),

  getUser: () =>
    request<{ userId: string; name: string; email: string }>("/api/v1/users"),

  getProjects: () =>
    request<{ projects: Project[] }>("/api/v1/projects"),

  createProject: (name: string, repoUrl: string, variables: EnvVariableRow[] = []) =>
    request<Project & { deploymentId: string; deploymentStatus: string }>(
      "/api/v1/projects",
      {
        method: "POST",
        body: JSON.stringify({ name, repoUrl, variables }),
      },
    ),

  getProjectVariables: (projectId: string) =>
    request<{ variables: ProjectVariable[] }>(
      `/api/v1/projects/${projectId}/variables`,
    ),

  updateProjectVariables: (projectId: string, variables: EnvVariableRow[]) =>
    request<{
      variables: ProjectVariable[];
      redeploy: { started: boolean; deploymentId?: string; reason?: string };
    }>(
      `/api/v1/projects/${projectId}/variables`,
      {
        method: "PUT",
        body: JSON.stringify(variables),
      },
    ),

  getDeploymentsByProject: (projectId: string) =>
    request<{ deployments: Deployment[] }>(
      `/api/v1/deployments/project/${projectId}`,
    ),

  getDeployment: (deploymentId: string) =>
    request<Deployment>(`/api/v1/deployments/${deploymentId}`),

  getDeploymentStatus: (deploymentId: string) =>
    request<{
      deploymentId: string;
      status: Deployment["status"];
      url?: string;
      error?: string;
    }>(`/api/v1/deployments/${deploymentId}/status`),

  stopDeployment: (deploymentId: string) =>
    request<Deployment>(`/api/v1/deployments/${deploymentId}`, {
      method: "DELETE",
    }),

  startProjectDeployment: (projectId: string) =>
    request<{ deploymentId: string; status: string }>(
      `/api/v1/projects/${projectId}/deploy`,
      { method: "POST" },
    ),

  archiveProject: (projectId: string) =>
    request<{ projectId: string; name: string; status: string }>(
      `/api/v1/projects/${projectId}`,
      { method: "DELETE" },
    ),

  getProjectsWithLatestDeploy: async (): Promise<ProjectWithLatestDeploy[]> => {
    const { projects } = await api.getProjects();
    const enriched = await Promise.all(
      projects.map(async (project) => {
        try {
          const { deployments } = await api.getDeploymentsByProject(
            project.projectId,
          );
          return { ...project, latestDeployment: deployments[0] };
        } catch {
          return { ...project };
        }
      }),
    );
    return enriched;
  },
};

export function fetcher<T>(url: string): Promise<T> {
  const token = getToken();
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (res) => {
    if (res.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError("Unauthorized", 401);
    }
    if (!res.ok) {
      throw new ApiError(`Request failed (${res.status})`, res.status);
    }
    const json = (await res.json()) as ApiResponse<T>;
    return json.data;
  });
}
