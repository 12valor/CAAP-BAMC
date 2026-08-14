import { notFound } from "next/navigation";

import { AdminFormLayout } from "@/components/admin/admin-form-layout";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { TransactionForm } from "../../transaction-form";
import type { TransactionRow } from "../../transaction-manager";

export default async function EditTransactionPage({ params }: { params: Promise<{ transactionId: string }> }) {
  await requireRole("admin"); const { transactionId } = await params; const admin = createAdminClient();
  const [transaction, employees, types, documents] = await Promise.all([admin.from("transactions").select("id,employee_id,transaction_type_id,transaction_date,reference_number,direction,amount,status,description,attachment_document_id,deleted_at").eq("id", transactionId).maybeSingle(), admin.from("employee_profiles").select("id,employee_number,first_name,last_name").is("deleted_at", null).order("last_name"), admin.from("transaction_types").select("id,name,direction,financial_category_id,reference_strategy").eq("is_active", true).is("deleted_at", null).order("name"), admin.from("documents").select("id,employee_id,original_filename").eq("status", "available").is("deleted_at", null).limit(500)]);
  if (!transaction.data) notFound(); if (employees.error || types.error || documents.error) throw new Error("Unable to load transaction options.");
  return <AdminFormLayout title="Edit transaction" backHref="/admin/transactions"><TransactionForm transaction={transaction.data as unknown as TransactionRow} employees={employees.data ?? []} types={types.data ?? []} documents={documents.data ?? []} /></AdminFormLayout>;
}
