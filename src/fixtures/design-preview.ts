/**
 * Isolated design-review fixtures. These values are synthetic and must never be
 * imported by database clients, Server Actions, or production data services.
 */

export type ShellUserFixture = {
  displayName: string;
  initials: string;
  roleLabel: string;
  officeLabel: string;
};

export type SummaryFixture = {
  label: string;
  value: string;
  helper: string;
  status: "neutral" | "success" | "warning" | "info";
};

export type ActivityFixture = {
  id: string;
  employee: string;
  category: string;
  date: string;
  amount: string;
  status: "Recorded" | "For review" | "Completed";
};

export const shellUserFixtures = {
  admin: {
    displayName: "Bookkeeper Preview",
    initials: "BP",
    roleLabel: "Bookkeeper / Admin",
    officeLabel: "CAAP BAMC",
  },
  employee: {
    displayName: "Employee Preview",
    initials: "EP",
    roleLabel: "Employee",
    officeLabel: "CAAP BAMC",
  },
} as const satisfies Record<"admin" | "employee", ShellUserFixture>;

export const adminSummaryFixtures = [
  {
    label: "Sample employees",
    value: "524",
    helper: "Fixture count for layout review",
    status: "info",
  },
  {
    label: "Sample transactions",
    value: "1,248",
    helper: "Current preview period",
    status: "success",
  },
  {
    label: "Items for review",
    value: "12",
    helper: "Synthetic attention state",
    status: "warning",
  },
] as const satisfies readonly SummaryFixture[];

export const employeeSummaryFixtures = [
  {
    label: "Statement status",
    value: "Current",
    helper: "Sample status only",
    status: "success",
  },
  {
    label: "Active sample loans",
    value: "2",
    helper: "Synthetic account preview",
    status: "info",
  },
  {
    label: "Documents available",
    value: "8",
    helper: "Authorized preview items",
    status: "neutral",
  },
] as const satisfies readonly SummaryFixture[];

export const activityFixtures = [
  {
    id: "PREVIEW-001",
    employee: "Sample Employee A",
    category: "Loan payment",
    date: "Aug 11, 2026",
    amount: "PHP 2,500.00",
    status: "Recorded",
  },
  {
    id: "PREVIEW-002",
    employee: "Sample Employee B",
    category: "Rebate",
    date: "Aug 10, 2026",
    amount: "PHP 750.00",
    status: "For review",
  },
  {
    id: "PREVIEW-003",
    employee: "Sample Employee C",
    category: "Leave adjustment",
    date: "Aug 9, 2026",
    amount: "Not applicable",
    status: "Completed",
  },
] as const satisfies readonly ActivityFixture[];
