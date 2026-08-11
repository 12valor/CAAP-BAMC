import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="employee">{children}</AppShell>;
}
