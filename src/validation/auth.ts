import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must contain at least 3 characters.")
  .max(32, "Username must contain at most 32 characters.")
  .regex(
    /^[a-z0-9][a-z0-9._-]*$/,
    "Use lowercase letters, numbers, periods, hyphens, or underscores.",
  );

export const issuedPasswordSchema = z
  .string()
  .min(12, "Password must contain at least 12 characters.")
  .max(128, "Password must contain at most 128 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required.").max(256),
});

export const createEmployeeAccountSchema = z.object({
  employeeId: z.uuid(),
  username: usernameSchema,
  password: z.union([issuedPasswordSchema, z.literal("")]),
});

export const resetPasswordSchema = z.object({
  profileId: z.uuid(),
  password: z.union([issuedPasswordSchema, z.literal("")]),
  reason: z.string().trim().min(5).max(500),
});

export const accountStatusSchema = z.object({
  profileId: z.uuid(),
  enabled: z.boolean(),
  reason: z.string().trim().min(5).max(500),
});

export type LoginInput = z.input<typeof loginSchema>;
export type CreateEmployeeAccountInput = z.input<
  typeof createEmployeeAccountSchema
>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type AccountStatusInput = z.input<typeof accountStatusSchema>;
