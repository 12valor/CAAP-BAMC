"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { generateIssuedPassword } from "@/lib/auth/security";
import type { AccountActionResult } from "@/lib/auth/types";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  accountStatusSchema,
  createEmployeeAccountSchema,
  resetPasswordSchema,
  type AccountStatusInput,
  type CreateEmployeeAccountInput,
  type ResetPasswordInput,
} from "@/validation/auth";

const INTERNAL_AUTH_DOMAIN = "accounts.caap-bamc.invalid";

export async function createEmployeeAccountAction(
  input: CreateEmployeeAccountInput,
): Promise<AccountActionResult> {
  const principal = await requireRole("admin");
  const parsed = createEmployeeAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid account details." };
  }

  const admin = createAdminClient();
  const authUserId = randomUUID();
  const internalAuthIdentifier = `${authUserId}@${INTERNAL_AUTH_DOMAIN}`;
  const generated = parsed.data.password.length === 0;
  const password = generated ? generateIssuedPassword() : parsed.data.password;

  const { error: authError } = await admin.auth.admin.createUser({
    id: authUserId,
    email: internalAuthIdentifier,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: "Supabase Auth could not create the employee account." };
  }

  const { error: databaseError } = await admin.rpc("create_employee_account", {
    actor_profile_id: principal.id,
    employee_record_id: parsed.data.employeeId,
    new_auth_user_id: authUserId,
    account_username: parsed.data.username,
    auth_identifier: internalAuthIdentifier,
  });

  if (databaseError) {
    await admin.auth.admin.deleteUser(authUserId, false);
    if (databaseError.code === "23505") {
      return { error: "That username is already assigned to an account." };
    }
    return { error: "The account could not be linked to the employee record." };
  }

  revalidatePath("/admin/employees");
  return {
    success: "Employee account created.",
    oneTimePassword: generated ? password : undefined,
  };
}

export async function resetEmployeePasswordAction(
  input: ResetPasswordInput,
): Promise<AccountActionResult> {
  const principal = await requireRole("admin");
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid reset details." };
  }

  const admin = createAdminClient();
  const generated = parsed.data.password.length === 0;
  const password = generated ? generateIssuedPassword() : parsed.data.password;
  const { data: account, error: accountError } = await admin
    .from("account_usernames")
    .select("profile_id")
    .eq("profile_id", parsed.data.profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (accountError || !account) {
    return { error: "The employee account was not found." };
  }

  const { error: resetError } = await admin.auth.admin.updateUserById(
    parsed.data.profileId,
    { password },
  );
  if (resetError) {
    return { error: "Supabase Auth could not reset the password." };
  }

  const { error: auditError } = await admin.rpc("record_password_reset", {
    actor_profile_id: principal.id,
    target_profile_id: parsed.data.profileId,
    reset_reason: parsed.data.reason,
    generated_password: generated,
  });

  if (auditError) {
    return {
      error:
        "The password changed, but its audit event could not be recorded. Contact the system administrator.",
    };
  }

  return {
    success: "Password reset completed.",
    oneTimePassword: generated ? password : undefined,
  };
}

export async function setEmployeeAccountStatusAction(
  input: AccountStatusInput,
): Promise<AccountActionResult> {
  const principal = await requireRole("admin");
  const parsed = accountStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status change." };
  }

  const admin = createAdminClient();
  const banDuration = parsed.data.enabled ? "none" : "876000h";
  const { error: authError } = await admin.auth.admin.updateUserById(
    parsed.data.profileId,
    { ban_duration: banDuration },
  );
  if (authError) {
    return { error: "Supabase Auth could not update the account status." };
  }

  const { error: profileError } = await admin.rpc("set_account_status", {
    actor_profile_id: principal.id,
    target_profile_id: parsed.data.profileId,
    account_enabled: parsed.data.enabled,
    change_reason: parsed.data.reason,
  });

  if (profileError) {
    const { error: compensationError } = await admin.auth.admin.updateUserById(
      parsed.data.profileId,
      {
      ban_duration: parsed.data.enabled ? "876000h" : "none",
      },
    );
    return {
      error: compensationError
        ? "The application status was not updated, but the Auth status may have changed. Contact the system administrator."
        : "The account status could not be updated. No status change was kept.",
    };
  }

  revalidatePath("/admin/employees");
  return {
    success: parsed.data.enabled ? "Account enabled." : "Account disabled.",
  };
}
