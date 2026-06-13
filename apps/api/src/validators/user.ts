import { z } from "zod";

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  repoUrl: z.string().trim().url("Invalid repository URL"),
});

export const projectIdParamsSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
});

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateUserBodySchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
