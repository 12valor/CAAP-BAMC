import type { Metadata } from "next";

import { DashboardPreview } from "@/components/preview/dashboard-preview";

export const metadata: Metadata = {
  title: "Administrator workspace",
};

export default function AdminPage() {
  return <DashboardPreview role="admin" />;
}
