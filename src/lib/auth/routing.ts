import type { AppRole } from "@/types/auth";

export function roleHome(role: AppRole) {
  return role === "admin" ? "/admin/dashboard" : "/statement-of-account";
}
