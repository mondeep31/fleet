import { z } from "zod";

export const repoOwnerRepoParamsSchema = z.object({
  owner: z.string().trim().min(1, "Owner is required"),
  repo: z.string().trim().min(1, "Repo is required"),
});

export const validateDockerfileBodySchema = z.object({
  owner: z.string().trim().min(1, "Owner is required"),
  repo: z.string().trim().min(1, "Repo is required"),
  branch: z.string().trim().min(1, "Branch is required"),
});

export const reposQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(30),
  q: z.string().trim().optional(),
});

export type RepoOwnerRepoParams = z.infer<typeof repoOwnerRepoParamsSchema>;
export type ValidateDockerfileBody = z.infer<typeof validateDockerfileBodySchema>;
export type ReposQuery = z.infer<typeof reposQuerySchema>;
