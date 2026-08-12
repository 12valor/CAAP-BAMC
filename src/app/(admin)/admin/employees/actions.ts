"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { generateIssuedPassword } from "@/lib/auth/security";
import type { AccountActionResult } from "@/lib/auth/types";
import { databaseActionError, type AdminActionResult } from "@/lib/admin-action";
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
import { employeeArchiveSchema, employeeRecordSchema } from "@/validation/employee";

const INTERNAL_AUTH_DOMAIN = "accounts.caap-bamc.invalid";

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

export async function saveEmployeeAction(formData: FormData): Promise<AdminActionResult> {
  const principal = await requireRole("admin");
  const parsed = employeeRecordSchema.safeParse({
    employeeId: formString(formData, "employeeId") || undefined,
    employeeNumber: formString(formData, "employeeNumber"),
    firstName: formString(formData, "firstName"), middleName: formString(formData, "middleName"),
    lastName: formString(formData, "lastName"), suffix: formString(formData, "suffix"),
    department: formString(formData, "department"), positionTitle: formString(formData, "positionTitle"),
    employmentCategory: formString(formData, "employmentCategory"),
    employmentStatus: formString(formData, "employmentStatus"),
    emailAddress: formString(formData, "emailAddress"), mobileNumber: formString(formData, "mobileNumber"),
    addressText: formString(formData, "addressText"), notes: formString(formData, "notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid employee details." };
  const { employeeId, ...data } = parsed.data;
  const payload = {
    employee_number: data.employeeNumber, first_name: data.firstName, middle_name: data.middleName,
    last_name: data.lastName, suffix: data.suffix, department: data.department,
    position_title: data.positionTitle, employment_category: data.employmentCategory,
    employment_status: data.employmentStatus, email_address: data.emailAddress,
    mobile_number: data.mobileNumber, address_text: data.addressText, notes: data.notes,
  };
  const admin = createAdminClient();
  const { data: id, error } = await admin.rpc("manage_employee_record", {
    actor_profile_id: principal.id, operation: employeeId ? "update" : "create",
    employee_record_id: employeeId, payload,
  });
  if (error) return { error: databaseActionError(error, "The employee record could not be saved.") };
  revalidatePath("/admin/employees");
  if (employeeId) revalidatePath(`/admin/employees/${employeeId}`);
  return { success: employeeId ? "Employee record updated." : "Employee record created.", id: id ?? undefined };
}

export async function archiveEmployeeAction(formData: FormData): Promise<AdminActionResult> {
  const principal = await requireRole("admin");
  const parsed = employeeArchiveSchema.safeParse({
    employeeId: formString(formData, "employeeId"), operation: formString(formData, "operation"),
    reason: formString(formData, "reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid archive request." };
  const admin = createAdminClient();
  const { data: employee } = await admin.from("employee_profiles").select("profile_id").eq("id", parsed.data.employeeId).maybeSingle();
  if (parsed.data.operation === "archive" && employee?.profile_id) {
    const { error: authError } = await admin.auth.admin.updateUserById(employee.profile_id, { ban_duration: "876000h" });
    if (authError) return { error: "The linked account could not be disabled, so the employee was not archived." };
  }
  const { error } = await admin.rpc("manage_employee_record", {
    actor_profile_id: principal.id, operation: parsed.data.operation,
    employee_record_id: parsed.data.employeeId, change_reason: parsed.data.reason, payload: {},
  });
  if (error) return { error: databaseActionError(error, "The archive status could not be changed.") };
  revalidatePath("/admin/employees"); revalidatePath(`/admin/employees/${parsed.data.employeeId}`);
  return { success: parsed.data.operation === "archive" ? "Employee archived and linked access disabled." : "Employee restored." };
}

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
