import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth/routing";
import type { AuthenticatedPrincipal } from "@/lib/auth/types";
import { APP_ROLES, type AppRole } from "@/types/auth";

export { roleHome } from "@/lib/auth/routing";

function isAppRole(role: string): role is AppRole {
  return APP_ROLES.includes(role as AppRole);
}

export async function getCurrentPrincipal(): Promise<AuthenticatedPrincipal | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, status, display_name, deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.status !== "active" ||
    profile.deleted_at ||
    !isAppRole(profile.role)
  ) {
    await supabase.auth.signOut({ scope: "local" });
    return null;
  }

  let employeeId: string | null = null;
  if (profile.role === "employee") {
    const { data: employee } = await supabase
      .from("employee_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!employee) {
      await supabase.auth.signOut({ scope: "local" });
      return null;
    }
    employeeId = employee.id;
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    role: profile.role,
    employeeId,
  };
}

export async function requirePrincipal() {
  const principal = await getCurrentPrincipal();
  if (!principal) {
    redirect("/login?reason=session-expired");
  }
  return principal;
}

export async function requireRole(role: AppRole) {
  const principal = await requirePrincipal();
  if (principal.role !== role) {
    redirect(roleHome(principal.role));
  }
  return principal;
}
