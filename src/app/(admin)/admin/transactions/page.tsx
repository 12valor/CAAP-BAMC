import type { Metadata } from "next";

import { TransactionManager, type TransactionPageData } from "./transaction-manager";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Transactions" };
type Props = { searchParams: Promise<Record<string, string | undefined>> };
const filterId = (value?: string) => value && value !== "all" ? value : undefined;

export default async function TransactionsPage({ searchParams }: Props) {
  const principal = await requireRole("admin");
  const query = await searchParams;
  const admin = createAdminClient();
  const [page, employees, types] = await Promise.all([
    admin.rpc("get_admin_transaction_page", {
      actor_profile_id: principal.id, search_query: query.q || undefined,
      employee_filter: filterId(query.employee), transaction_type_filter: filterId(query.type),
      date_from: query.from || undefined, date_to: query.to || undefined,
      include_archived: query.archived === "true", cursor_date: query.cursorDate || undefined,
      cursor_id: query.cursorId || undefined, page_size: 26,
    }),
    admin.from("employee_profiles").select("id,employee_number,first_name,last_name").is("deleted_at", null).order("last_name"),
    admin.from("transaction_types").select("id,name,direction,financial_category_id,reference_strategy").eq("is_active", true).is("deleted_at", null).order("name"),
  ]);
  if (page.error || employees.error || types.error) throw new Error("Unable to load the transaction ledger.");
  return <div className="space-y-6">
    <PageHeader title="Transactions" />
    <TransactionManager page={page.data as unknown as TransactionPageData} employees={employees.data ?? []}
      types={types.data ?? []} filters={query} />
  </div>;
}
