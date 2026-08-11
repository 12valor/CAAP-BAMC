import { z } from "zod";

const supabasePublishableKeySchema = z
  .string()
  .trim()
  .min(20, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.")
  .refine(
    (key) =>
      !key.startsWith("sb_secret_") &&
      !key.toLowerCase().includes("service_role"),
    "Use a publishable key in browser configuration, never a secret or service-role key.",
  )
  .refine(
    (key) => key.startsWith("sb_publishable_"),
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key.",
  );

export const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.")
    .refine(
      (url) => url.startsWith("https://") || url.startsWith("http://localhost"),
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS outside local development.",
    ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKeySchema,
});

export const serverEnvironmentSchema = publicEnvironmentSchema.extend({
  SUPABASE_SECRET_KEY: z
    .string()
    .trim()
    .refine(
      (key) => key.startsWith("sb_secret_"),
      "SUPABASE_SECRET_KEY must be a current Supabase secret key.",
    ),
  AUTH_RATE_LIMIT_SECRET: z
    .string()
    .min(32, "AUTH_RATE_LIMIT_SECRET must contain at least 32 characters."),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parsePublicEnvironment(
  environment: Record<string, string | undefined>,
): PublicEnvironment {
  return publicEnvironmentSchema.parse(environment);
}

export function getPublicEnvironment(): PublicEnvironment {
  return parsePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getServerEnvironment(): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    AUTH_RATE_LIMIT_SECRET: process.env.AUTH_RATE_LIMIT_SECRET,
  });
}
