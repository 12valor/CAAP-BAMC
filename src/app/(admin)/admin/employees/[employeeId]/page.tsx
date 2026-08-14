import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil } from "lucide-react";

import { AccountManagement, type EmployeeAccountRow } from "../account-management";
import { EmployeeSafetyActions } from "../employee-safety-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/permissions/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

const tabs = [
  "overview",
  "transactions",
  "loans",
  "rebates",
  "leave",
  "documents",
  "activity",
] as const;
type Tab = (typeof tabs)[number];
type Props = {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
};

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: Props) {
  await requireRole("admin");
  const { employeeId } = await params;
  const query = await searchParams;
  const tab: Tab = tabs.includes(query.tab as Tab)
    ? (query.tab as Tab)
    : "overview";
  const admin = createAdminClient();
  const { data: employee } = await admin
    .from("employee_profiles")
    .select("*")
    .eq("id", employeeId)
    .maybeSingle();
  if (!employee) notFound();

  const [transactions, loans, rebates, leave, documents, activity] =
    await Promise.all([
      admin
        .from("transactions")
        .select(
          "id, transaction_date, direction, amount, status, reference_number",
        )
        .eq("employee_id", employeeId)
        .order("transaction_date", { ascending: false })
        .limit(20),
      admin
        .from("loans")
        .select("id, account_number, principal_amount, status, start_date")
        .eq("employee_id", employeeId)
        .order("start_date", { ascending: false })
        .limit(20),
      admin
        .from("rebates")
        .select("id, rebate_date, amount, status, calculation_source")
        .eq("employee_id", employeeId)
        .order("rebate_date", { ascending: false })
        .limit(20),
      admin
        .from("leave_entries")
        .select("id, effective_date, entry_kind, quantity_delta, status")
        .eq("employee_id", employeeId)
        .order("effective_date", { ascending: false })
        .limit(20),
      admin
        .from("documents")
        .select("id, document_date, original_filename, status")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("audit_logs")
        .select("id, action, occurred_at, reason, entity_table")
        .eq("entity_id", employeeId)
        .order("occurred_at", { ascending: false })
        .limit(20),
    ]);

  const name = [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
    employee.suffix,
  ]
    .filter(Boolean)
    .join(" ");
  const records: Record<Tab, Array<Record<string, unknown>>> = {
    overview: [],
    transactions: transactions.data ?? [],
    loans: loans.data ?? [],
    rebates: rebates.data ?? [],
    leave: leave.data ?? [],
    documents: documents.data ?? [],
    activity: activity.data ?? [],
  };

  const [{ data: username }, { data: profile }] = employee.profile_id
    ? await Promise.all([
        admin.from("account_usernames").select("username").eq("profile_id", employee.profile_id).is("deleted_at", null).maybeSingle(),
        admin.from("profiles").select("status").eq("id", employee.profile_id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const accountRows: EmployeeAccountRow[] = [{ employeeId: employee.id, employeeNumber: employee.employee_number, name, position: employee.position_title, profileId: employee.profile_id, username: username?.username ?? null, status: profile?.status === "active" ? "active" : employee.profile_id ? "disabled" : null }];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <Button asChild variant="link" className="px-0">
          <Link href="/admin/employees">← Employee directory</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{name}</h1>
          <Badge variant={employee.deleted_at ? "secondary" : "success"}>
            {employee.deleted_at ? "Archived" : employee.employment_status}
          </Badge></div>
          <div className="flex gap-2">{!employee.deleted_at ? <Button asChild variant="outline"><Link href={`/admin/employees/${employee.id}/edit`}><Pencil />Edit</Link></Button> : null}<EmployeeSafetyActions employeeId={employee.id} archived={Boolean(employee.deleted_at)} /></div>
        </div>
        <p className="text-muted-foreground">
          {employee.employee_number} · {employee.department ?? "No department"}{" "}
          · {employee.position_title ?? "No position"}
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b"
        aria-label="Employee record sections"
      >
        {tabs.map((item) => (
          <Button
            key={item}
            asChild
            variant={tab === item ? "default" : "ghost"}
            className="rounded-b-none capitalize"
          >
            <Link href={`/admin/employees/${employeeId}?tab=${item}`}>
              {item}
            </Link>
          </Button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact and employment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <b>Email:</b> {employee.email_address ?? "—"}
              </p>
              <p>
                <b>Mobile:</b> {employee.mobile_number ?? "—"}
              </p>
              <p>
                <b>Address:</b> {employee.address_text ?? "—"}
              </p>
              <p>
                <b>Category:</b> {employee.employment_category}
              </p>
              <p>
                <b>Notes:</b> {employee.notes ?? "—"}
              </p>
            </CardContent>
          </Card>
          <AccountManagement employees={accountRows} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{tab}</CardTitle>
          </CardHeader>
          <CardContent>
            {records[tab].length ? (
              <RecordTable rows={records[tab]} />
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No {tab} records are linked to this employee.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecordTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  const firstRow = rows[0];
  if (!firstRow) return null;
  const columns = Object.keys(firstRow).filter((key) => key !== "id");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column.replaceAll("_", " ")}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={String(row.id)}>
            {columns.map((column) => (
              <TableCell key={column} className="max-w-80 whitespace-normal">
                {column === "status" || column === "action" ? (
                  <Badge variant="secondary">
                    {String(row[column] ?? "—").replaceAll("_", " ")}
                  </Badge>
                ) : (
                  String(row[column] ?? "—")
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
