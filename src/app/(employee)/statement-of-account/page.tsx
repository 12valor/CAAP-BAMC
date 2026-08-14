import type { Metadata } from "next";
import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";

import { PrintButton } from "@/components/portal/print-button";
import { StatementDocument } from "@/components/portal/statement-document";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/lib/permissions/authorization";
import { getMyStatement } from "@/lib/portal/statement";
import { createClient } from "@/lib/supabase/server";
import { parseStatementFilters } from "@/validation/statement";

export const metadata: Metadata = { title: "Statement of Account" };
export const dynamic = "force-dynamic";

export default async function StatementOfAccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("employee");
  const raw = await searchParams;
  const parsed = parseStatementFilters(raw);
  const filters = parsed.success ? parsed.data : {};
  const supabase = await createClient();
  const [statement, { data: categories }] = await Promise.all([
    getMyStatement(filters),
    supabase
      .from("financial_categories")
      .select("id,name")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name"),
  ]);
  if (!statement)
    throw new Error("No employee statement is available for this account.");

  const query = new URLSearchParams(
    Object.entries(filters).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );

  return (
    <div className="px-3 py-5 sm:px-6 sm:py-7 lg:py-9">
      <section
        className="screen-controls mx-auto mb-5 max-w-7xl space-y-4 print:hidden"
        aria-label="Statement controls"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Statement filters</h2>
            <p className="text-sm text-muted-foreground">
              All active transactions are shown when no dates are selected.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrintButton />
            <Button asChild>
              <a href={`/api/portal/statement.pdf?${query}`}>
                <Download />
                Download PDF
              </a>
            </Button>
          </div>
        </div>
        <form className="grid gap-4 border bg-white p-4 md:grid-cols-[1fr_1fr_1.4fr_auto_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="statement-start">Start date</Label>
            <Input
              id="statement-start"
              type="date"
              name="start"
              defaultValue={filters.start}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statement-end">End date</Label>
            <Input
              id="statement-end"
              type="date"
              name="end"
              defaultValue={filters.end}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statement-category">Transaction category</Label>
            <select
              id="statement-category"
              name="category"
              defaultValue={filters.category ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3"
            >
              <option value="">All categories</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Apply filters</Button>
          <Button variant="outline" asChild>
            <Link href="/statement-of-account">
              <RotateCcw />
              Clear filters
            </Link>
          </Button>
        </form>
        {!parsed.success ? (
          <p
            role="alert"
            className="border border-status-danger bg-status-danger-muted px-4 py-3 text-sm text-status-danger"
          >
            The selected filters are invalid. Showing all transactions.
          </p>
        ) : null}
      </section>
      <StatementDocument statement={statement} />
    </div>
  );
}
