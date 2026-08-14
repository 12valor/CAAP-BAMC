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
};

export const adminNavigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Employees",
    href: "/admin/employees",
    icon: Users,
  },
  {
    label: "Transactions",
    href: "/admin/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Loans",
    href: "/admin/loans",
    icon: Landmark,
  },
  {
    label: "Rebates",
    href: "/admin/rebates",
    icon: BadgePercent,
  },
  {
    label: "Leave Records",
    href: "/admin/leave-records",
    icon: CalendarDays,
  },
  {
    label: "Documents",
    href: "/admin/documents",
    icon: FolderOpen,
  },
  {
    label: "Imports",
    href: "/admin/imports",
    icon: FileUp,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    icon: ScrollText,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
] as const satisfies readonly NavigationItem[];

export const employeeNavigation = [
  {
    label: "Statement of Account",
    href: "/statement-of-account",
    icon: ReceiptText,
  },
] as const satisfies readonly NavigationItem[];

export const navigationByRole = {
  admin: adminNavigation,
  employee: employeeNavigation,
} as const satisfies Record<NavigationRole, readonly NavigationItem[]>;
