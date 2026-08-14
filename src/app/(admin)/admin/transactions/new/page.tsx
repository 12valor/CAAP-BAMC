import { AdminFormLayout } from "@/components/admin/admin-form-layout";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { TransactionForm } from "../transaction-form";

export default async function NewTransactionPage() {
  await requireRole("admin"); const admin = createAdminClient();
  const [employees, types, documents] = await Promise.all([admin.from("employee_profiles").select("id,employee_number,first_name,last_name").is("deleted_at", null).order("last_name"), admin.from("transaction_types").select("id,name,direction,financial_category_id,reference_strategy").eq("is_active", true).is("deleted_at", null).order("name"), admin.from("documents").select("id,employee_id,original_filename").eq("status", "available").is("deleted_at", null).limit(500)]);
  if (employees.error || types.error || documents.error) throw new Error("Unable to load transaction options.");
  return <AdminFormLayout title="Add transaction" backHref="/admin/transactions" note="Amounts stay positive; the selected type determines debit or credit."><TransactionForm employees={employees.data ?? []} types={types.data ?? []} documents={documents.data ?? []} /></AdminFormLayout>;
}
