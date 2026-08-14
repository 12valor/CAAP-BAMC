import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BadgePercent,
  CalendarDays,
  ChartNoAxesCombined,
  FileUp,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

export type NavigationRole = "admin" | "employee";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  actionLabel: string;
};

export const adminNavigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    description:
      "Review the shared dashboard layout and system status patterns.",
    actionLabel: "Create record",
  },
  {
    label: "Employees",
    href: "/admin/employees",
    icon: Users,
    description: "Employee directory and account-management placeholder.",
    actionLabel: "Add employee",
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: ArrowLeftRight,
    description: "Transaction entry, review, and correction placeholder.",
    actionLabel: "Add transaction",
  },
  {
    label: "Loans",
    href: "/admin/loans",
    icon: Landmark,
    description: "Configurable loan records and schedules placeholder.",
    actionLabel: "Add loan",
  },
  {
    label: "Rebates",
    href: "/admin/rebates",
    icon: BadgePercent,
    description: "Rebate recording and review placeholder.",
    actionLabel: "Add rebate",
  },
  {
    label: "Leave Records",
    href: "/admin/leave-records",
    icon: CalendarDays,
    description: "Leave balance and history management placeholder.",
    actionLabel: "Add leave record",
  },
  {
    label: "Documents",
    href: "/admin/documents",
    icon: FolderOpen,
    description: "Employee-first document folders placeholder.",
    actionLabel: "Upload document",
  },
  {
    label: "Imports",
    href: "/admin/imports",
    icon: FileUp,
    description: "Excel import review and validation placeholder.",
    actionLabel: "Start import",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: ChartNoAxesCombined,
    description: "Financial and operational report placeholder.",
    actionLabel: "Create report",
  },
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    icon: ScrollText,
    description: "Read-only audit event review placeholder.",
    actionLabel: "Export log",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Categories, types, and system settings placeholder.",
    actionLabel: "Review settings",
  },
] as const satisfies readonly NavigationItem[];

export const employeeNavigation = [
  {
    label: "Statement of Account",
    href: "/statement-of-account",
    icon: ReceiptText,
    description: "Read-only employee financial statement.",
    actionLabel: "Download statement",
  },
] as const satisfies readonly NavigationItem[];

export const navigationByRole = {
  admin: adminNavigation,
  employee: employeeNavigation,
} as const satisfies Record<NavigationRole, readonly NavigationItem[]>;
