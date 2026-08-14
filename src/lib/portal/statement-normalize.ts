import type { EmployeeStatement } from "@/lib/portal/statement";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function rows(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(record)
        .filter((item): item is JsonRecord => item !== null)
    : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function nullableText(value: unknown) {
  const result = text(value);
  return result ? result : null;
}

function integer(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

export function hasStatementSummary(value: unknown) {
  return Boolean(record(record(value)?.summary));
}

export function normalizeEmployeeStatement(
  value: unknown,
  overviewValue?: unknown,
): EmployeeStatement | null {
  const source = record(value);
  const employee = record(source?.employee);
  if (!source || !employee) return null;

  const period = record(source.period);
  const totals = record(source.totals);
  const summary = record(source.summary);
  const overview = record(overviewValue);

  const transactions = rows(source.transactions).map((item, index) => ({
    id: text(item.id, `transaction-${index}`),
    date: text(item.date),
    reference_number: nullableText(item.reference_number),
    direction: item.direction === "credit" ? ("credit" as const) : ("debit" as const),
    amount: text(item.amount, "0"),
    description: nullableText(item.description),
    transaction_type: text(item.transaction_type, "Transaction"),
    category: nullableText(item.category),
    running_balance: text(item.running_balance, "0"),
  }));

  return {
    employee: {
      id: text(employee.id),
      employee_number: text(employee.employee_number),
      full_name: text(employee.full_name, "Employee"),
      department: nullableText(employee.department),
      position_title: nullableText(employee.position_title),
    },
    period: {
      start: nullableText(period?.start),
      end: nullableText(period?.end),
    },
    generated_at: text(source.generated_at, new Date().toISOString()),
    summary: {
      current_balance:
        nullableText(summary?.current_balance) ??
        nullableText(overview?.current_balance),
      selected_debit: text(summary?.selected_debit ?? totals?.debit, "0"),
      selected_credit: text(summary?.selected_credit ?? totals?.credit, "0"),
      outstanding_loan_balance:
        nullableText(summary?.outstanding_loan_balance) ??
        nullableText(overview?.outstanding_amount),
    },
    transactions,
    totals: {
      debit: text(totals?.debit ?? summary?.selected_debit, "0"),
      credit: text(totals?.credit ?? summary?.selected_credit, "0"),
    },
    loans: rows(source.loans).map((loan, loanIndex) => ({
      id: text(loan.id, `loan-${loanIndex}`),
      type: text(loan.type, "Loan"),
      account_number: nullableText(loan.account_number),
      principal: text(loan.principal, "0"),
      total_payable: text(loan.total_payable, loan.principal ? text(loan.principal) : "0"),
      outstanding_balance: nullableText(loan.outstanding_balance),
      start_date: nullableText(loan.start_date),
      term_count: integer(loan.term_count),
      installment_frequency: nullableText(loan.installment_frequency),
      status: text(loan.status, "active"),
      next_payment_date: nullableText(loan.next_payment_date),
      schedules: rows(loan.schedules).map((schedule, scheduleIndex) => ({
        installment_number:
          integer(schedule.installment_number) ?? scheduleIndex + 1,
        due_date: text(schedule.due_date),
        scheduled_amount: text(
          schedule.scheduled_amount ?? schedule.total_due,
          "0",
        ),
        amount_paid: nullableText(schedule.amount_paid),
        remaining_amount: nullableText(schedule.remaining_amount),
        status: text(schedule.status, "pending"),
      })),
    })),
    rebates: rows(source.rebates).map((rebate, index) => ({
      id: text(rebate.id, `rebate-${index}`),
      date: text(rebate.date),
      type: text(rebate.type, "Rebate"),
      reference_number: nullableText(rebate.reference_number),
      amount: text(rebate.amount, "0"),
      description: nullableText(rebate.description),
      status: text(rebate.status, "posted"),
    })),
    attachments: rows(source.attachments)
      .filter((attachment) => Boolean(text(attachment.id)))
      .map((attachment) => ({
        id: text(attachment.id),
        filename: text(attachment.filename, "Document"),
        category: text(attachment.category, "Not specified"),
        related_record: text(attachment.related_record, "Employee record"),
        date: nullableText(attachment.date),
        mime_type: text(attachment.mime_type, "application/octet-stream"),
      })),
  };
}
