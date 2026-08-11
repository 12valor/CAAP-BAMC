import type { AppRole } from "@/types/auth";

export type AuthenticatedPrincipal = {
  displayName: string;
  employeeId: string | null;
  id: string;
  role: AppRole;
};

export type LoginActionResult = {
  error?: string;
};

export type AccountActionResult = {
  error?: string;
  oneTimePassword?: string;
  success?: string;
};
