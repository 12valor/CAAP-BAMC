import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Users,
  Landmark,
  ReceiptText,
  CalendarDays,
  Upload,
} from "lucide-react";
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
import { formatExactMoney } from "@/lib/reports/format";
import { currentMonthManila } from "@/lib/reports/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administrator dashboard" };
type Params = { start?: string; end?: string; all?: string };
type Summary = {
  employees: { total: number; active: number };
  loans: {
    active: number;
    original_principal: string;
    scheduled_outstanding: string;
  };
  transactions: { debit: string; credit: string };
  rebates: { total: string };
  documents: {
    total: number;
    available: number;
    pending: number;
    archived: number;
    bytes: number;
  };
  leave: Array<{ type: string; unit: string; balance: string }>;
  recent_transactions: Array<{
    id: string;
    transaction_date: string;
    reference_number: string | null;
    direction: string;
    amount: string;
    employee_number: string;
    employee_name: string;
    transaction_type: string;
  }>;
  recent_imports: Array<{
    id: string;
    source_filename: string;
    import_type: string;
    status: string;
    total_rows: number;
    valid_rows: number;
    error_rows: number;
    created_at: string;
  }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRole("admin");
  const raw = await searchParams;
  const defaults = currentMonthManila();
  const all = raw.all === "true";
  const start = all ? undefined : raw.start || defaults.start;
  const end = all ? undefined : raw.end || defaults.end;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_dashboard_summary", {
    start_date: start,
    end_date: end,
  });
  if (error) throw new Error("Unable to load the dashboard summary.");
  const s = data as unknown as Summary;
  const cards = [
    {
      label: "Active employees",
      value: String(s.employees.active),
      helper: `${s.employees.total} total master records`,
      icon: Users,
    },
    {
      label: "Active loans",
      value: String(s.loans.active),
      helper: `Original principal ${formatExactMoney(s.loans.original_principal)}`,
      icon: Landmark,
    },
    {
      label: "Scheduled outstanding",
      value: formatExactMoney(s.loans.scheduled_outstanding),
      helper: "Provisional: payable less posted payments",
      icon: ReceiptText,
    },
    {
      label: "Period debits",
      value: formatExactMoney(s.transactions.debit),
      helper: "Posted transactions",
      icon: ReceiptText,
    },
    {
      label: "Period credits",
      value: formatExactMoney(s.transactions.credit),
      helper: "Posted transactions",
      icon: ReceiptText,
    },
    {
      label: "Period rebates",
      value: formatExactMoney(s.rebates.total),
      helper: "Posted rebates",
      icon: CalendarDays,
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        actions={
          <Button asChild>
            <Link href="/admin/reports">Open reports</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="start">
                Start date
              </label>
              <Input id="start" name="start" type="date" defaultValue={start} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="end">
                End date
              </label>
              <Input id="end" name="end" type="date" defaultValue={end} />
            </div>
            <Button>Apply dates</Button>
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard?all=true">All time</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin/dashboard">Current month</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Dashboard totals"
      >
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
              </div>
              <Icon className="size-5 text-primary" />
            </CardHeader>
          </Card>
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leave summary</CardTitle>
          </CardHeader>
          <CardContent>
            {s.leave.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave type</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.leave.map((x) => (
                    <TableRow key={`${x.type}-${x.unit}`}>
                      <TableCell>{x.type}</TableCell>
                      <TableCell>{x.unit}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {x.balance}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No leave balances recorded.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Document storage</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-semibold">{s.documents.total}</p>
              <p className="text-sm text-muted-foreground">Total files</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {(s.documents.bytes / 1024 / 1024).toFixed(1)} MB
              </p>
              <p className="text-sm text-muted-foreground">Stored size</p>
            </div>
            <Badge variant="success">{s.documents.available} available</Badge>
            <Badge variant="warning">{s.documents.pending} pending</Badge>
            <Badge variant="secondary">{s.documents.archived} archived</Badge>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {s.recent_transactions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.recent_transactions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.transaction_date}</TableCell>
                    <TableCell>
                      {r.employee_number} - {r.employee_name}
                    </TableCell>
                    <TableCell>{r.transaction_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.direction === "debit" ? "warning" : "success"
                        }
                      >
                        {r.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatExactMoney(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions recorded.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent imports</CardTitle>
          </div>
          <Upload className="size-5 text-primary" />
        </CardHeader>
        <CardContent>
          {s.recent_imports.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.recent_imports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Intl.DateTimeFormat("en-PH", {
                        dateStyle: "medium",
                        timeZone: "Asia/Manila",
                      }).format(new Date(r.created_at))}
                    </TableCell>
                    <TableCell>{r.source_filename}</TableCell>
                    <TableCell>{r.import_type.replaceAll("_", " ")}</TableCell>
                    <TableCell>
                      <Badge>{r.status.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.valid_rows}/{r.total_rows}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-2 size-6" />
              No imports recorded.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
