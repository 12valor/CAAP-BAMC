import type { Metadata } from "next";

import { DashboardPreview } from "@/components/preview/dashboard-preview";

export const metadata: Metadata = { title: "Employee overview" };

export default function PortalOverviewPage() {
  return <DashboardPreview role="employee" />;
}
