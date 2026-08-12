export const REPORTS = [
  "statement", "ledger", "loan-balances", "loan-schedules", "rebates",
  "leave", "employees", "imports", "audit",
] as const;

export type ReportId = (typeof REPORTS)[number];

export type ReportFilters = {
  report: ReportId;
  start?: string;
  end?: string;
  employee?: string;
  actor?: string;
  module?: string;
  status?: string;
  category?: string;
  department?: string;
  q?: string;
  cursorKey?: string;
  cursorId?: string;
};

export type ReportColumn = { key: string; label: string; kind?: "money" | "date" | "datetime" };
export type ReportRow = Record<string, string | number | boolean | null> & { id: string };
export type ReportPage = {
  title: string;
  description: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  nextCursor?: { key: string; id: string };
  totals?: Record<string, string>;
};

export const REPORT_LABELS: Record<ReportId, string> = {
  statement: "Employee Statement of Account",
  ledger: "Debit / credit ledger",
  "loan-balances": "Loan balances",
  "loan-schedules": "Loan payment schedules",
  rebates: "Rebate history",
  leave: "Leave balances and history",
  employees: "Employee master list",
  imports: "Import results",
  audit: "Audit activity",
};

export const PDF_REPORTS = new Set<ReportId>([
  "statement", "ledger", "loan-balances", "loan-schedules", "rebates", "leave", "employees",
]);
