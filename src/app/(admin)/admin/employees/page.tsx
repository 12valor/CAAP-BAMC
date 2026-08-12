import type { Metadata } from "next";

import { EmployeeManager, type EmployeeRow } from "./employee-manager";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { employeeListSchema } from "@/validation/employee";

export const metadata: Metadata = { title: "Employees" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const item = params[key]; return Array.isArray(item) ? item[0] : item;
}

export default async function EmployeesPage({ searchParams }: Props) {
  const principal = await requireRole("admin");
  const raw = await searchParams;
  const filters = employeeListSchema.parse({
    q: value(raw, "q"), status: value(raw, "status"), department: value(raw, "department"),
    category: value(raw, "category"), archived: value(raw, "archived"),
    cursorKey: value(raw, "cursorKey"), cursorId: value(raw, "cursorId"),
  });
  const admin = createAdminClient();
  const [{ data, error }, { data: options, error: optionError }] = await Promise.all([
    admin.rpc("get_admin_employee_page", {
      actor_profile_id: principal.id, search_query: filters.q || undefined,
      status_filter: filters.status === "all" ? undefined : filters.status || undefined,
      department_filter: filters.department === "all" ? undefined : filters.department || undefined,
      category_filter: filters.category === "all" ? undefined : filters.category || undefined,
      include_archived: filters.archived === "true",
      cursor_sort_key: filters.cursorKey, cursor_id: filters.cursorId, page_size: 26,
    }),
    admin.from("employee_profiles").select("department, employment_category").is("deleted_at", null),
  ]);
  if (error || optionError) throw new Error("Unable to load employee records.");
  const rows = (data ?? []) as EmployeeRow[];
  const hasNext = rows.length > 25;
  const shownRows = hasNext ? rows.slice(0, 25) : rows;
  return <div className="space-y-6">
    <PageHeader eyebrow="Administrator workspace" preview={false} title="Employee master records"
      description="Search, maintain, archive, and issue access for employee records." />
    <EmployeeManager rows={shownRows} hasNext={hasNext} filters={filters}
      departments={[...new Set((options ?? []).map((row) => row.department).filter(Boolean))] as string[]}
      categories={[...new Set((options ?? []).map((row) => row.employment_category).filter(Boolean))] as string[]} />
  </div>;
}
