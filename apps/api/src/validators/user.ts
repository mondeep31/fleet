import { z } from "zod";

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateUserBodySchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid("Invalid user id"),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
