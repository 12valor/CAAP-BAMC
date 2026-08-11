import type { Metadata } from "next";
import { Users } from "lucide-react";

import { SectionPlaceholder } from "@/components/preview/section-placeholder";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <SectionPlaceholder
      eyebrow="Administrator workspace"
      title="Employees"
      description="Employee directory and account-management placeholder."
      actionLabel="Add employee"
      icon={Users}
    />
  );
}
