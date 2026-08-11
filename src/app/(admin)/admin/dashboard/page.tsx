import type { Metadata } from "next";

import { DashboardPreview } from "@/components/preview/dashboard-preview";

export const metadata: Metadata = { title: "Administrator dashboard" };

export default function AdminDashboardPage() {
  return <DashboardPreview role="admin" />;
}
