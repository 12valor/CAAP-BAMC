/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/permissions/authorization";
import {
  listAdminActors,
  loadReport,
  searchEmployees,
} from "@/lib/reports/data";
import { parseReportFilters } from "@/lib/reports/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Audit Log" };
type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Raw>;
}) {
  await requireRole("admin");
  const raw = await searchParams;
  const tab = one(raw.tab) === "authentication" ? "authentication" : "records";
  const employees = await searchEmployees("");
  if (tab === "records") {
    const filters = parseReportFilters({
      ...raw,
      report: "audit",
      status: one(raw.action),
    });
    const page = await loadReport(filters);
    const base = {
      tab: "records",
      employee: filters.employee,
      actor: filters.actor,
      module: filters.module,
      action: filters.status,
      start: filters.start,
      end: filters.end,
    };
    return (
      <div className="space-y-6">
        <Header tab={tab} />
        <AuditFilters tab={tab} raw={raw} employees={employees} />
        <Card>
          <CardHeader>
            <CardTitle>Record activity</CardTitle>
            <CardDescription>
              Append-only create, update, soft-delete, restore, import,
              password-reset, and settings events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {page.rows.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date and time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Safe changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Manila",
                        }).format(new Date(String(r.occurred_at)))}
                      </TableCell>
                      <TableCell>{String(r.actor)}</TableCell>
                      <TableCell>{String(r.employee)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {String(r.action).replaceAll("_", " ")}
                        </Badge>
                        <span className="ml-2">{String(r.module)}</span>
                      </TableCell>
                      <TableCell className="max-w-lg whitespace-normal">
                        <details>
                          <summary className="cursor-pointer font-medium text-primary">
                            View differences
                          </summary>
                          <p className="mt-2 break-words text-muted-foreground">
                            {String(r.changes)}
                          </p>
                          {r.reason && (
                            <p className="mt-2">
                              <strong>Reason:</strong> {String(r.reason)}
                            </p>
                          )}
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty />
            )}
            <Pager base={base} next={page.nextCursor} />
          </CardContent>
        </Card>
      </div>
    );
  }
  const db = createAdminClient();
  let query = db
    .from("login_activity")
    .select(
      "id,occurred_at,profile_id,outcome,user_agent,profiles(display_name)",
    )
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(51);
  const start = one(raw.start),
    end = one(raw.end),
    outcome = one(raw.outcome);
  if (start) query = query.gte("occurred_at", `${start}T00:00:00Z`);
  if (end) query = query.lte("occurred_at", `${end}T23:59:59Z`);
  if (outcome) query = query.eq("outcome", outcome);
  const { data, error } = await query;
  if (error) throw new Error("Unable to load authentication activity.");
  const rows = (data ?? []).slice(0, 50);
  const next = (data ?? []).length > 50 ? rows.at(-1) : undefined;
  return (
    <div className="space-y-6">
      <Header tab={tab} />
      <AuditFilters tab={tab} raw={raw} employees={employees} />
      <Card>
        <CardHeader>
          <CardTitle>Authentication activity</CardTitle>
          <CardDescription>
            Successful, failed, disabled, rate-limited, expired-session, and
            logout events. Fingerprints are never displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date and time</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Manila",
                      }).format(new Date(r.occurred_at))}
                    </TableCell>
                    <TableCell>
                      {r.profiles?.display_name ?? "Unknown account"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.outcome === "success"
                            ? "success"
                            : r.outcome === "rate_limited"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {r.outcome.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-80 truncate">
                      {r.user_agent ?? "Not available"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty />
          )}
          {next && (
            <p className="mt-4 text-right text-sm text-muted-foreground">
              More authentication records are available; narrow the date or
              outcome filter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Header({ tab }: { tab: string }) {
  return (
    <>
      <PageHeader
        eyebrow="Administrator workspace"
        title="Audit viewer"
        description="Read-only operational and authentication activity with sensitive values removed."
        preview={false}
      />
      <nav className="flex gap-2">
        <Button variant={tab === "records" ? "default" : "outline"} asChild>
          <Link href="/admin/audit-log?tab=records">Record activity</Link>
        </Button>
        <Button
          variant={tab === "authentication" ? "default" : "outline"}
          asChild
        >
          <Link href="/admin/audit-log?tab=authentication">
            Authentication activity
          </Link>
        </Button>
      </nav>
    </>
  );
}
async function AuditFilters({
  tab,
  raw,
  employees,
}: {
  tab: string;
  raw: Raw;
  employees: Array<{
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
  }>;
}) {
  const actors = await listAdminActors();
  return (
    <Card>
      <CardContent className="pt-6">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <input type="hidden" name="tab" value={tab} />
          {tab === "records" ? (
            <>
              <select
                name="actor"
                defaultValue={one(raw.actor) ?? ""}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All actors</option>
                {actors.map((a) => (
                  <option value={a.id} key={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
              <select
                name="employee"
                defaultValue={one(raw.employee) ?? ""}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All employees</option>
                {employees.map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.employee_number} - {e.last_name}
                  </option>
                ))}
              </select>
              <Input
                name="action"
                defaultValue={one(raw.action)}
                placeholder="Action"
              />
              <Input
                name="module"
                defaultValue={one(raw.module)}
                placeholder="Module, e.g. transactions"
              />
            </>
          ) : (
            <>
              <select
                name="actor"
                defaultValue={one(raw.actor) ?? ""}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All actors</option>
                {actors.map((a) => (
                  <option value={a.id} key={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
              <Input
                name="outcome"
                defaultValue={one(raw.outcome)}
                placeholder="Outcome"
              />
            </>
          )}
          <Input name="start" defaultValue={one(raw.start)} type="date" />
          <Input name="end" defaultValue={one(raw.end)} type="date" />
          <Button>Apply filters</Button>
          <Button variant="ghost" asChild>
            <Link href={`/admin/audit-log?tab=${tab}`}>Clear</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
function Empty() {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      No activity matches the selected filters.
    </div>
  );
}
function Pager({
  base,
  next,
}: {
  base: Record<string, string | undefined>;
  next?: { key: string; id: string };
}) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <Button variant="outline" asChild>
        <Link href={{ pathname: "/admin/audit-log", query: base }}>
          First page
        </Link>
      </Button>
      {next && (
        <Button asChild>
          <Link
            href={{
              pathname: "/admin/audit-log",
              query: { ...base, cursorKey: next.key, cursorId: next.id },
            }}
          >
            Next 50
          </Link>
        </Button>
      )}
    </div>
  );
}
