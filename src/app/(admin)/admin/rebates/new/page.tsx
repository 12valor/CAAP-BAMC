import { AdminFormLayout } from "@/components/admin/admin-form-layout";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { RebateForm } from "../rebate-form";

export default async function NewRebatePage() {
  await requireRole("admin"); const admin = createAdminClient();
  const [employees, types, loans] = await Promise.all([admin.from("employee_profiles").select("id,employee_number,first_name,last_name").is("deleted_at", null).order("last_name"), admin.from("rebate_types").select("id,code,name,calculation_strategy,fixed_amount,percentage_rate,balance_effect,rounding_method").eq("is_active", true).is("deleted_at", null), admin.from("loans").select("id,employee_id,account_number,principal_amount,status").is("deleted_at", null).neq("status", "cancelled")]);
  if (employees.error || types.error || loans.error) throw new Error("Unable to load rebate options.");
  return <AdminFormLayout title="Add rebate" backHref="/admin/rebates" note="Overrides require a reason."><RebateForm employees={employees.data ?? []} types={types.data ?? []} loans={loans.data ?? []} /></AdminFormLayout>;
}
