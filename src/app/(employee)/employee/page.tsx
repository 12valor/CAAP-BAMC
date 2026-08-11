import type { Metadata } from "next";

import { DashboardPreview } from "@/components/preview/dashboard-preview";

export const metadata: Metadata = {
  title: "Employee workspace",
};

export default function EmployeePage() {
  return <DashboardPreview role="employee" />;
}
