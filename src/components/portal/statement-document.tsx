import { Download, Eye } from "lucide-react";

import { CaapLogo } from "@/components/branding/caap-logo";
import { Button } from "@/components/ui/button";
import type { EmployeeStatement } from "@/lib/portal/statement";
import { formatExactPeso } from "@/lib/portal/statement-format";

function philippineDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

function financialValue(value: string | null) {
  return value === null ? "Not available" : formatExactPeso(value);
}

export function statementPeriod(statement: EmployeeStatement) {
  const { start, end } = statement.period;
  if (!start && !end) return "All Transactions";
  if (start && end) return `${philippineDate(start)} to ${philippineDate(end)}`;
  if (start) return `From ${philippineDate(start)}`;
  return `Through ${philippineDate(end)}`;
}

export function StatementDocument({
  statement,
}: {
  statement: EmployeeStatement;
}) {
  const generated = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(statement.generated_at));

  return (
    <article className="statement-paper mx-auto w-full max-w-[210mm] bg-white px-4 py-6 text-[0.9375rem] text-slate-950 shadow-sm ring-1 ring-slate-200 sm:px-8 sm:py-9 lg:px-12 lg:py-11 print:max-w-none print:p-0 print:shadow-none print:ring-0">
      <header className="flex items-start justify-between gap-5 border-b-2 border-slate-900 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-20 shrink-0">
            <CaapLogo priority sizes="80px" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">
              Civil Aviation Authority of the Philippines
            </p>
            <p className="font-semibold">Bacolod–Silay Airport · BAMC</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">
              Statement of Account
            </h1>
          </div>
        </div>
        <dl className="hidden shrink-0 text-right text-xs sm:block">
          <dt className="font-semibold text-slate-500 uppercase">
            Statement period
          </dt>
          <dd className="mt-1 font-semibold">{statementPeriod(statement)}</dd>
          <dt className="mt-3 font-semibold text-slate-500 uppercase">
            Generated
          </dt>
          <dd className="mt-1">{generated}</dd>
        </dl>
      </header>

      <div className="mt-5 sm:hidden">
        <p className="text-xs font-semibold text-slate-500 uppercase">
          Statement period
        </p>
        <p className="font-semibold">{statementPeriod(statement)}</p>
        <p className="mt-1 text-sm text-slate-600">Generated {generated}</p>
      </div>

      <section
        className="statement-section mt-7"
        aria-labelledby="employee-information"
      >
        <h2 id="employee-information" className="statement-heading">
          Employee information
        </h2>
        <dl className="grid border border-slate-400 sm:grid-cols-2">
          <Info label="Employee name" value={statement.employee.full_name} />
          <Info
            label="Employee number"
            value={statement.employee.employee_number}
          />
          <Info
            label="Department"
            value={statement.employee.department ?? "Not specified"}
          />
          <Info
            label="Position"
            value={statement.employee.position_title ?? "Not specified"}
          />
        </dl>
      </section>

      <section
        className="statement-section mt-7"
        aria-labelledby="account-summary"
      >
        <h2 id="account-summary" className="statement-heading">
          Account summary
        </h2>
        <div className="overflow-x-auto">
          <table className="statement-table min-w-[620px]">
            <thead>
              <tr>
                <th>Current balance</th>
                <th>Total debits</th>
                <th>Total credits</th>
                <th>Outstanding loan balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-semibold">
                <td className="number-cell">
                  {financialValue(statement.summary.current_balance)}
                </td>
                <td className="number-cell">
                  {formatExactPeso(statement.summary.selected_debit)}
                </td>
                <td className="number-cell">
                  {formatExactPeso(statement.summary.selected_credit)}
                </td>
                <td className="number-cell">
                  {financialValue(
                    statement.summary.outstanding_loan_balance,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <StatementSection title="Transaction history" id="transaction-history">
        <div className="overflow-x-auto">
          <table className="statement-table min-w-[860px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference no.</th>
                <th>Particulars / description</th>
                <th>Category</th>
                <th className="number-cell">Debit</th>
                <th className="number-cell">Credit</th>
                <th className="number-cell">Running balance</th>
              </tr>
            </thead>
            <tbody>
              {statement.transactions.length ? (
                statement.transactions.map((item) => (
                  <tr key={item.id}>
                    <td>{philippineDate(item.date)}</td>
                    <td>{item.reference_number ?? "—"}</td>
                    <td>
                      <span className="font-medium">
                        {item.transaction_type}
                      </span>
                      {item.description ? (
                        <span className="block text-xs text-slate-600">
                          {item.description}
                        </span>
                      ) : null}
                    </td>
                    <td>{item.category ?? "—"}</td>
                    <td className="number-cell">
                      {item.direction === "debit"
                        ? formatExactPeso(item.amount)
                        : "—"}
                    </td>
                    <td className="number-cell">
                      {item.direction === "credit"
                        ? formatExactPeso(item.amount)
                        : "—"}
                    </td>
                    <td className="number-cell font-medium">
                      {formatExactPeso(item.running_balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  columns={7}
                  label="No transactions match the selected filters."
                />
              )}
            </tbody>
          </table>
        </div>
      </StatementSection>

      <StatementSection title="Active loans" id="active-loans" pageBreak>
        <div className="overflow-x-auto">
          <table className="statement-table min-w-[820px]">
            <thead>
              <tr>
                <th>Loan type / reference</th>
                <th>Start date</th>
                <th>Term</th>
                <th className="number-cell">Principal</th>
                <th className="number-cell">Outstanding</th>
                <th>Next payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {statement.loans.length ? (
                statement.loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <span className="font-medium">{loan.type}</span>
                      <span className="block text-xs text-slate-600">
                        {loan.account_number ?? "No reference"}
                      </span>
                    </td>
                    <td>{philippineDate(loan.start_date)}</td>
                    <td>
                      {loan.term_count && loan.installment_frequency
                        ? `${loan.term_count} · ${loan.installment_frequency.replaceAll("_", " ")}`
                        : "—"}
                    </td>
                    <td className="number-cell">
                      {formatExactPeso(loan.principal)}
                    </td>
                    <td className="number-cell font-medium">
                      {financialValue(loan.outstanding_balance)}
                    </td>
                    <td>{philippineDate(loan.next_payment_date)}</td>
                    <td className="capitalize">
                      {loan.status.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={7} />
              )}
            </tbody>
          </table>
        </div>
      </StatementSection>

      <StatementSection
        title="Loan payment schedules"
        id="loan-schedules"
        pageBreak
      >
        {statement.loans.length ? (
          statement.loans.map((loan) => (
            <section key={loan.id} className="schedule-group mb-6 last:mb-0">
              <h3 className="mb-2 font-semibold">
                {loan.type} · {loan.account_number ?? "No reference"}
              </h3>
              <div className="overflow-x-auto">
                <table className="statement-table min-w-[650px]">
                  <thead>
                    <tr>
                      <th>Installment</th>
                      <th>Due date</th>
                      <th className="number-cell">Scheduled amount</th>
                      <th className="number-cell">Amount paid</th>
                      <th className="number-cell">Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loan.schedules.length ? (
                      loan.schedules.map((schedule) => (
                        <tr key={`${loan.id}-${schedule.installment_number}`}>
                          <td>{schedule.installment_number}</td>
                          <td>{philippineDate(schedule.due_date)}</td>
                          <td className="number-cell">
                            {formatExactPeso(schedule.scheduled_amount)}
                          </td>
                          <td className="number-cell">
                            {financialValue(schedule.amount_paid)}
                          </td>
                          <td className="number-cell">
                            {financialValue(schedule.remaining_amount)}
                          </td>
                          <td className="capitalize">
                            {schedule.status.replaceAll("_", " ")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyRow columns={6} />
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        ) : (
          <EmptyNotice />
        )}
      </StatementSection>

      <StatementSection title="Rebate history" id="rebate-history" pageBreak>
        <div className="overflow-x-auto">
          <table className="statement-table min-w-[700px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Rebate type</th>
                <th>Reference no.</th>
                <th className="number-cell">Amount</th>
                <th>Description / remarks</th>
              </tr>
            </thead>
            <tbody>
              {statement.rebates.length ? (
                statement.rebates.map((rebate) => (
                  <tr key={rebate.id}>
                    <td>{philippineDate(rebate.date)}</td>
                    <td>{rebate.type}</td>
                    <td>{rebate.reference_number ?? "—"}</td>
                    <td className="number-cell">
                      {formatExactPeso(rebate.amount)}
                    </td>
                    <td>{rebate.description ?? "—"}</td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={5} />
              )}
            </tbody>
          </table>
        </div>
      </StatementSection>

      <StatementSection
        title="Related attachments"
        id="related-attachments"
        pageBreak
      >
        <div className="overflow-x-auto">
          <table className="statement-table min-w-[720px]">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Document category</th>
                <th>Related record</th>
                <th>Document date</th>
                <th className="screen-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {statement.attachments.length ? (
                statement.attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <td className="max-w-64 break-words font-medium">
                      {attachment.filename}
                    </td>
                    <td>{attachment.category}</td>
                    <td>{attachment.related_record}</td>
                    <td>{philippineDate(attachment.date)}</td>
                    <td className="screen-only">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={`/api/documents/${attachment.id}`}
                            target="_blank"
                          >
                            <Eye />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={`/api/documents/${attachment.id}?download=1`}
                          >
                            <Download />
                            Download
                          </a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={5} />
              )}
            </tbody>
          </table>
        </div>
      </StatementSection>

      <footer className="mt-10 flex items-end justify-between gap-4 border-t border-slate-400 pt-4 text-xs text-slate-600">
        <p>System-generated statement. No signature is required.</p>
        <p className="text-right">Generated {generated}</p>
      </footer>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-300 p-3 last:border-b-0 sm:[&:nth-child(odd)]:border-r">
      <dt className="text-xs font-semibold text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
function StatementSection({
  title,
  id,
  pageBreak = false,
  children,
}: {
  title: string;
  id: string;
  pageBreak?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`statement-section mt-8 ${pageBreak ? "print-section-break" : ""}`}
      aria-labelledby={id}
    >
      <h2 id={id} className="statement-heading">
        {title}
      </h2>
      {children}
    </section>
  );
}
function EmptyRow({
  columns,
  label = "No records available.",
}: {
  columns: number;
  label?: string;
}) {
  return (
    <tr>
      <td colSpan={columns} className="py-7 text-center text-slate-500">
        {label}
      </td>
    </tr>
  );
}
function EmptyNotice() {
  return (
    <p className="border border-dashed border-slate-400 p-6 text-center text-slate-500">
      No records available.
    </p>
  );
}
