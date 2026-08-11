import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/permissions/authorization";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await requireRole("employee");
  return (
    <AppShell
      role="employee"
      user={{ displayName: principal.displayName, roleLabel: "Employee" }}
    >
      {children}
    </AppShell>
  );
}
