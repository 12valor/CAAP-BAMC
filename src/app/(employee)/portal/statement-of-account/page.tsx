import type { Metadata } from "next";
import { Download } from "lucide-react";

import { PrintButton } from "@/components/portal/print-button";
import { Button } from "@/components/ui/button";
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
import { getMyStatement, money } from "@/lib/portal/statement";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Statement of Account" };

export default async function StatementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("employee");
  const params = await searchParams;
  const filters = {
    start: params.start,
    end: params.end,
    type: params.type,
    category: params.category,
  };
  const supabase = await createClient();
  const [statement, { data: types }, { data: categories }] = await Promise.all([
    getMyStatement(filters),
    supabase
      .from("transaction_types")
      .select("id,name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("financial_categories")
      .select("id,name")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!statement)
    throw new Error("No employee statement is available for this account.");

  const query = new URLSearchParams(
    Object.entries(filters).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  const scheduleRows = statement.loans.flatMap((loan) =>
    loan.schedules.map((schedule, index) => ({
      id: `${loan.id}-${index}`,
      loan: `${loan.type} · ${loan.account_number}`,
      principal: loan.principal,
      loanStatus: loan.status,
      ...schedule,
    })),
  );

  return (
    <div className="space-y-6 print:space-y-3">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase print:hidden">
            Employee self-service
          </p>
          <h1 className="text-3xl font-bold">Statement of Account</h1>
          <p className="mt-2">
            {statement.employee.full_name} ·{" "}
            {statement.employee.employee_number}
          </p>
          <p className="text-sm text-muted-foreground">
            Generated {new Date(statement.generated_at).toLocaleString("en-PH")}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <Button asChild>
            <a href={`/api/portal/statement.pdf?${query}`}>
              <Download />
              Download PDF
            </a>
          </Button>
        </div>
      </header>

      <form className="grid gap-3 rounded-xl border bg-card p-4 print:hidden md:grid-cols-5">
        <Input
          type="date"
          name="start"
          defaultValue={filters.start}
          aria-label="Start date"
        />
        <Input
          type="date"
          name="end"
          defaultValue={filters.end}
          aria-label="End date"
        />
        <select
          name="type"
          defaultValue={filters.type ?? ""}
          aria-label="Transaction type"
          className="h-10 rounded-lg border bg-background px-3"
        >
          <option value="">All transaction types</option>
          {types?.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          aria-label="Financial category"
          className="h-10 rounded-lg border bg-background px-3"
        >
          <option value="">All categories</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Button>Apply filters</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <Summary label="Selected debit" value={money(statement.totals.debit)} />
        <Summary
          label="Selected credit"
          value={money(statement.totals.credit)}
        />
      </div>

      <TableSection title="Transactions">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Type / category</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Running balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statement.transactions.length ? (
              statement.transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.reference_number ?? "—"}</TableCell>
                  <TableCell>
                    {transaction.transaction_type}
                    <small className="block text-muted-foreground">
                      {transaction.category}
                    </small>
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.direction === "debit"
                      ? money(transaction.amount)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.direction === "credit"
                      ? money(transaction.amount)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {money(transaction.running_balance)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyTableRow
                columns={6}
                label="No transactions match the selected period."
              />
            )}
          </TableBody>
        </Table>
      </TableSection>

      <TableSection title="Loans and payment schedules">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Amount due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduleRows.length ? (
              scheduleRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="font-medium">{row.loan}</span>
                    <small className="block text-muted-foreground">
                      {row.loanStatus}
                    </small>
                  </TableCell>
                  <TableCell className="text-right">
                    {money(row.principal)}
                  </TableCell>
                  <TableCell>{row.due_date}</TableCell>
                  <TableCell className="text-right">
                    {money(row.total_due)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {row.status.replaceAll("_", " ")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyTableRow columns={5} />
            )}
          </TableBody>
        </Table>
      </TableSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableSection title="Rebate history">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.rebates.length ? (
                statement.rebates.map((rebate, index) => (
                  <TableRow key={`${rebate.date}-${index}`}>
                    <TableCell>{rebate.date}</TableCell>
                    <TableCell>{rebate.type}</TableCell>
                    <TableCell className="text-right font-medium">
                      {money(rebate.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyTableRow columns={3} />
              )}
            </TableBody>
          </Table>
        </TableSection>
        <TableSection title="Authorized attachments">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.attachments.length ? (
                statement.attachments.map((attachment) => (
                  <TableRow key={attachment.id}>
                    <TableCell className="max-w-80 truncate font-medium">
                      {attachment.filename}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/documents/${attachment.id}`}
                          target="_blank"
                        >
                          Open file
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyTableRow columns={2} />
              )}
            </TableBody>
          </Table>
        </TableSection>
      </div>
      <style>{`@media print{aside,nav,button,form{display:none!important}main{padding:0!important}.rounded-xl,.rounded-lg{border-radius:0!important}@page{margin:14mm}}`}</style>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <strong className="text-xl">{value}</strong>
    </section>
  );
}

function TableSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function EmptyTableRow({
  columns,
  label = "No records available.",
}: {
  columns: number;
  label?: string;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={columns}
        className="h-24 text-center text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  );
}
