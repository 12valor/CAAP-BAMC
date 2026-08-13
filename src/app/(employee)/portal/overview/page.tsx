import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, ReceiptText, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/permissions/authorization";
import { money } from "@/lib/portal/statement";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Employee overview" };

export default async function PortalOverviewPage() {
  await requireRole("employee");
  const supabase = await createClient();
  const [
    { data: overview, error },
    { data: rebates },
    { data: leave },
    { data: documents },
  ] = await Promise.all([
    supabase.rpc("get_my_financial_overview"),
    supabase
      .from("rebates")
      .select("id,rebate_date,amount,rebate_types(name)")
      .neq("status", "cancelled")
      .order("rebate_date", { ascending: false })
      .limit(5),
    supabase
      .from("leave_balances")
      .select("id,balance,leave_types(name,unit)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id,original_filename,created_at")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (error) throw new Error("Overview could not be loaded.");

  const summary = overview as unknown as Record<string, string | number>;
  const cards = [
    {
      label: "Current balance",
      value: money(summary.current_balance ?? 0),
      icon: WalletCards,
    },
    {
      label: "Total debit",
      value: money(summary.total_debit ?? 0),
      icon: ReceiptText,
    },
    {
      label: "Total credit",
      value: money(summary.total_credit ?? 0),
      icon: ReceiptText,
    },
    {
      label: "Active loans",
      value: `${summary.active_loan_count ?? 0} · ${money(summary.outstanding_amount ?? 0)}`,
      icon: Landmark,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            Employee self-service
          </p>
          <h1 className="text-3xl font-bold">Overview</h1>
          <p className="mt-2 text-muted-foreground">
            A live summary derived from your authenticated employee record.
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/statement-of-account">View statement</Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <section key={card.label} className="rounded-xl border bg-card p-5">
            <card.icon className="mb-4 size-6 text-primary" />
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <strong className="mt-1 block text-xl">{card.value}</strong>
          </section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Recent rebates">
          {rebates?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rebates.map((rebate) => (
                  <TableRow key={rebate.id}>
                    <TableCell>{rebate.rebate_date}</TableCell>
                    <TableCell>
                      {rebate.rebate_types?.name ?? "Rebate"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {money(rebate.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Leave balances">
          {leave?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leave.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell>
                      {balance.leave_types?.name ?? "Leave"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {balance.balance} {balance.leave_types?.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>

        <Panel title="Recent documents">
          {documents?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="max-w-48 truncate font-medium">
                      {document.original_filename}
                    </TableCell>
                    <TableCell>
                      {new Date(document.created_at).toLocaleDateString(
                        "en-PH",
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/documents/${document.id}`}
                          target="_blank"
                        >
                          Open
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return (
    <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
      No records available.
    </p>
  );
}
