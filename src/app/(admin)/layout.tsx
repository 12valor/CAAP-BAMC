import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/permissions/authorization";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await requireRole("admin");
  return (
    <AppShell
      role="admin"
      user={{ displayName: principal.displayName, roleLabel: "Bookkeeper / Admin" }}
    >
      {children}
    </AppShell>
  );
}
