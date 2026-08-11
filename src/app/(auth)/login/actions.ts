"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createLoginRequestContext,
  isLoginRateLimited,
  recordLoginActivity,
} from "@/lib/auth/login-activity";
import type { LoginActionResult } from "@/lib/auth/types";
import { roleHome } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/validation/auth";
import type { AppRole } from "@/types/auth";

const INVALID_LOGIN_MESSAGE =
  "The username or password is incorrect, or the account is unavailable.";

function fingerprintUuid(fingerprint: string) {
  const value = fingerprint.slice(0, 32);
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

export async function loginAction(
  input: LoginInput,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Enter a valid username and password." };
  }

  const requestHeaders = await headers();
  let destination: string | null = null;

  try {
    const context = createLoginRequestContext(
      parsed.data.username,
      requestHeaders,
    );
    const admin = createAdminClient();

    if (await isLoginRateLimited(context)) {
      await recordLoginActivity({ context, outcome: "rate_limited" });
      return {
        error: "Too many sign-in attempts. Wait 15 minutes and try again.",
      };
    }

    const { data: account, error: accountError } = await admin
      .from("account_usernames")
      .select("profile_id, internal_auth_identifier")
      .eq("username", context.normalizedUsername)
      .is("deleted_at", null)
      .maybeSingle();

    if (accountError) {
      throw accountError;
    }

    const { data: profile, error: profileError } = account
      ? await admin
          .from("profiles")
          .select("id, role, status, deleted_at")
          .eq("id", account.profile_id)
          .maybeSingle()
      : { data: null, error: null };

    if (profileError) {
      throw profileError;
    }

    const supabase = await createClient();
    const enabled =
      profile?.status === "active" &&
      !profile.deleted_at &&
      (profile.role === "admin" || profile.role === "employee");
    const authIdentifier =
      account && enabled
        ? account.internal_auth_identifier
        : `${fingerprintUuid(context.usernameFingerprint)}@accounts.caap-bamc.invalid`;

    const { data: signIn, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: authIdentifier,
        password: parsed.data.password,
      });

    if (
      signInError ||
      !account ||
      !profile ||
      !enabled ||
      signIn.user.id !== profile.id
    ) {
      if (signIn.user) {
        await supabase.auth.signOut({ scope: "local" });
      }
      await recordLoginActivity({
        context,
        outcome: account && profile && !enabled ? "disabled" : "invalid_credentials",
        profileId: account?.profile_id,
      });
      return { error: INVALID_LOGIN_MESSAGE };
    }

    try {
      const { error: activityError } = await admin
        .from("account_usernames")
        .update({ last_successful_login_at: new Date().toISOString() })
        .eq("profile_id", profile.id);
      if (activityError) {
        throw activityError;
      }

      await recordLoginActivity({
        context,
        outcome: "success",
        profileId: profile.id,
      });
    } catch {
      await supabase.auth.signOut({ scope: "local" });
      throw new Error("Unable to complete the login audit trail.");
    }
    destination = roleHome(profile.role as AppRole);
  } catch {
    return {
      error: "Sign in is temporarily unavailable. Please try again later.",
    };
  }

  redirect(destination ?? "/login");
}
